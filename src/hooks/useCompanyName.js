import { useMemo } from 'react';

/**
 * Reads company display name from persisted auth payload (matches Sidebar).
 */
export function useCompanyName() {
    return useMemo(() => {
        try {
            const authUserRaw = localStorage.getItem('auth_user');
            if (!authUserRaw) return 'UnifiedCore';
            const parsed = JSON.parse(authUserRaw);
            return parsed?.user?.company_name || 'UnifiedCore';
        } catch {
            return 'UnifiedCore';
        }
    }, []);
}
