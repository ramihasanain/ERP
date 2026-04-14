import React, { createContext, useContext, useMemo, useState } from 'react';
import { useCustomPost } from '@/hooks/useMutation';
import { toast } from 'sonner';
import {
    clearStoredUser,
    clearTenantDomain,
    extractTenantDomain,
    getStoredUser,
    isAuthenticated as hasAccessToken,
    removeTokens,
    storeTenantDomain,
    storeTokens,
    storeUser,
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
    const [user, setUser] = useState(getStoredUser());
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

        const normalizedUser = {
            ...responseUser,
            email: responseUser?.email || responseData?.email || '',
            role: responseUser?.role || fallbackRole,
            name: responseUser?.name || responseUser?.full_name || responseData?.full_name || responseData?.name || 'User',
        };

        return { tokenPayload, normalizedUser };
    };

    const login = async (email, password, role = 'admin') => {
        const response = await loginMutation.mutateAsync({ email, password });
        const { tokenPayload, normalizedUser } = normalizeAuthResponse(response, role);
        const tenantDomain = extractTenantDomain(response);

        storeTokens(tokenPayload);
        if (tenantDomain) {
            storeTenantDomain(tenantDomain);
        }

        setUser(normalizedUser);
        storeUser(normalizedUser);

        return normalizedUser;
    };

    const register = async (payload = {}) => {
        const response = await registerMutation.mutateAsync(payload);
        const { tokenPayload, normalizedUser } = normalizeAuthResponse(response, 'admin');
        const tenantDomain = extractTenantDomain(response);

        storeTokens(tokenPayload);
        if (tenantDomain) {
            storeTenantDomain(tenantDomain);
        }

        setUser(normalizedUser);
        storeUser(normalizedUser);

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
