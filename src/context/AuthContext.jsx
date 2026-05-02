import React, { createContext, useContext, useMemo, useState } from 'react';
import { useCustomPost } from '@/hooks/useMutation';
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
    const loginMutation = useCustomPost('/login/');
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
            },
        };

        return { tokenPayload, normalizedUser, normalizedAuthPayload };
    };

    const login = async (email, password, role = 'admin') => {
        const response = await loginMutation.mutateAsync({ email, password });
        const { tokenPayload, normalizedUser, normalizedAuthPayload } = normalizeAuthResponse(response, role);
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

        return normalizedUser;
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
        setUser(null);
        removeTokens();
        clearTenantDomain();
        clearStoredUser();
        toast.success('Signed out successfully.', successToastOptions);
    };

    const isAuthenticated = !!user || hasAccessToken();
    const isAdmin = user?.role === 'admin';
    const isEmployee = user?.role === 'employee';
    const isLoading = loginMutation.isPending || registerMutation.isPending;

    const contextValue = useMemo(() => ({
        user,
        isAuthenticated,
        isAdmin,
        isEmployee,
        isLoading,
        login,
        register,
        logout,
    }), [user, isAuthenticated, isAdmin, isEmployee, isLoading, login, register]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
