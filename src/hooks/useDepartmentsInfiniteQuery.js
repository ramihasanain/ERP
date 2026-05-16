import { useInfiniteQuery } from '@tanstack/react-query';
import { get } from '@/api';

const resolveDepartmentsNextPath = (next) => {
    if (next == null || next === '') return null;
    if (typeof next === 'number') return `/api/hr/departments/?page=${next}`;
    if (typeof next === 'string') {
        if (next.startsWith('http://') || next.startsWith('https://')) {
            try {
                const u = new URL(next);
                return `${u.pathname}${u.search}`;
            } catch {
                return null;
            }
        }
        return next.startsWith('/') ? next : null;
    }
    return null;
};

/**
 * Paginated departments list for SelectWithLoadMore. Call `fetchNextPage()` for more pages.
 */
export const useDepartmentsInfiniteQuery = (options = {}) => {
    const { enabled = true } = options;

    return useInfiniteQuery({
        queryKey: ['hr-departments', 'infinite'],
        initialPageParam: '/api/hr/departments/',
        queryFn: async ({ pageParam }) => get(pageParam),
        getNextPageParam: (lastPage) => resolveDepartmentsNextPath(lastPage?.next) ?? undefined,
        enabled,
    });
};
