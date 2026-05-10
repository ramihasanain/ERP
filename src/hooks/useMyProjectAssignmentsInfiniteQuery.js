import { useInfiniteQuery } from '@tanstack/react-query';
import { get } from '@/api';

export const resolveMyAssignmentsNextPath = (next) => {
    if (next == null || next === '') return null;
    if (typeof next === 'number') return `/api/hr/projects/my-assignments/?page=${next}`;
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
 * Paginated project assignments for the current employee (time tracker project picker).
 */
export const useMyProjectAssignmentsInfiniteQuery = (options = {}) => {
    return useInfiniteQuery({
        queryKey: ['hr-projects-my-assignments', 'infinite'],
        initialPageParam: '/api/hr/projects/my-assignments/',
        queryFn: async ({ pageParam }) => get(pageParam),
        getNextPageParam: (lastPage) => resolveMyAssignmentsNextPath(lastPage?.next) ?? undefined,
        ...options,
    });
};
