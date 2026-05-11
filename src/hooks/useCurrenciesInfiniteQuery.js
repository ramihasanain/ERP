import { useInfiniteQuery } from '@tanstack/react-query';
import { get } from '@/api';

export const resolveNextRequestPath = (next) => {
    if (next == null || next === '') return null;
    if (typeof next === 'number') return `/api/shared/currencies/?page=${next}`;
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
 * First page loads immediately; call `fetchNextPage()` for additional pages.
 */
export const useCurrenciesInfiniteQuery = () => {
    return useInfiniteQuery({
        queryKey: ['shared-currencies', 'infinite'],
        initialPageParam: '/api/shared/currencies/',
        queryFn: async ({ pageParam }) => get(pageParam),
        getNextPageParam: (lastPage) => resolveNextRequestPath(lastPage?.next) ?? undefined,
    });
};

