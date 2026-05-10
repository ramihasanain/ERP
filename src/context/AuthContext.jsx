import React, { createContext, useContext, useMemo, useState } from 'react';
import { useCustomPost } from '@/hooks/useMutation';
import { post } from '@/api';
import { toast } from 'sonner';
import {
    clearStoredUser,
    clearTenantDomain,
    extractTenantDomain,
    getStoredUser,
    isAuthenticated as hasAccessToken,
    migrateLegacyTokenStorage,
    persistAuthSession,
    removeTokens,
    storeUser,
    storeTenantDomain,
} from '@/services/auth';
import { successToastOptions } from '@/utils/toastOptions';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        migrateLegacyTokenStorage();
        return getStoredUser();
    });
    const registerMutation = useCustomPost('/register/');

    const normalizeAuthResponse = (responseData, fallbackRole = 'admin') => {
        const tokenPayload = {
            access: responseData?.access || responseData?.access_token || responseData?.tokens?.access,
            refresh: responseData?.refresh || responseData?.refresh_token || responseData?.tokens?.refresh,
        };

        const responseUser =
            responseData?.user ||
            responseData?.data?.user ||
            responseData?.results?.user ||
            null;

        const resolvedRole =
            responseUser?.role ||
            responseData?.role ||
            (responseData?.is_superuser ? 'admin' : fallbackRole);

        const normalizedUser = {
            ...responseUser,
            email: responseUser?.email || responseData?.email || '',
            role: resolvedRole,
            name: responseUser?.name || responseUser?.full_name || responseData?.full_name || responseData?.name || 'User',
            reset_password_required:
                responseUser?.reset_password_required ??
                responseData?.reset_password_required ??
                false,
        };

        // Tokens are persisted with the same `auth_user` blob (see persistAuthSession).
        const normalizedAuthPayload = {
            domain: responseData?.domain || responseData?.tenant_domain || null,
            is_superuser: Boolean(responseData?.is_superuser),
            permissions: responseData?.permissions || responseUser?.permissions || {},
            role: responseData?.role ?? responseUser?.role ?? null,
            user: {
                id: responseUser?.id || responseData?.id || null,
                full_name: responseUser?.full_name || responseData?.full_name || normalizedUser.name,
                company_name: responseUser?.company_name || responseData?.company_name || '',
                email: responseUser?.email || responseData?.email || '',
                role: resolvedRole,
                reset_password_required:
                    responseUser?.reset_password_required ??
                    responseData?.reset_password_required ??
                    false,
            },
        };

        return { tokenPayload, normalizedUser, normalizedAuthPayload };
    };

    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const login = async (email, password, role = 'admin', options = {}) => {
        console.log(options?.loginBaseUrl);
        setIsLoginLoading(true);
        try {
            const requestConfig = options?.loginBaseUrl
                ? { baseURL: options.loginBaseUrl }
                : {};
            const response = await post(`${requestConfig.baseURL || ''}/login/`, { email, password });
            const { tokenPayload, normalizedUser, normalizedAuthPayload } = normalizeAuthResponse(response, role);
            const tenantDomain = extractTenantDomain(response) || options?.loginBaseUrl || null;

            if (tenantDomain) {
                storeTenantDomain(tenantDomain);
            }

            persistAuthSession({
                ...normalizedAuthPayload,
                access: tokenPayload.access,
                refresh: tokenPayload.refresh,
            });

            setUser(normalizedUser);

            return normalizedUser;
        } finally {
            setIsLoginLoading(false);
        }
    };

    const register = async (payload = {}) => {
        const response = await registerMutation.mutateAsync(payload);
        const { tokenPayload, normalizedUser, normalizedAuthPayload } = normalizeAuthResponse(response, 'admin');
        const tenantDomain = extractTenantDomain(response);

        if (tenantDomain) {
            storeTenantDomain(tenantDomain);
        }

        persistAuthSession({
            ...normalizedAuthPayload,
            access: tokenPayload.access,
            refresh: tokenPayload.refresh,
        });

        setUser(normalizedUser);

        return response;
    };

    const logout = () => {
        const preserveTenantDomain = user?.role === 'employee';
        setUser(null);
        removeTokens();
        if (!preserveTenantDomain) {
            clearTenantDomain();
        }
        clearStoredUser();
        toast.success('Signed out successfully.', successToastOptions);
    };

    const updateUser = (userPatch = {}) => {
        setUser((prevUser) => {
            if (!prevUser) return prevUser;
            const nextUser = {
                ...prevUser,
                ...userPatch,
            };
            storeUser(nextUser);
            return nextUser;
        });
    };

    // Session is valid only while an access token exists (same source as `getAccessToken()`).
    // Avoid treating stale React user state as logged-in when tokens were cleared from storage.
    const tokenPresent = hasAccessToken();
    const isAuthenticated = tokenPresent;
    const resolvedUser = tokenPresent ? user : null;
    const isAdmin = resolvedUser?.role === 'admin';
    const isEmployee = resolvedUser?.role === 'employee';
    const isLoading = isLoginLoading || registerMutation.isPending;

    const contextValue = useMemo(() => ({
        user: resolvedUser,
        isAuthenticated,
        isAdmin,
        isEmployee,
        isLoading,
        login,
        register,
        logout,
        updateUser,
    }), [resolvedUser, isAuthenticated, isAdmin, isEmployee, isLoading, login, register]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
