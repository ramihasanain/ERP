import { useQuery } from '@tanstack/react-query';
import { get } from '@/api';

export const useCustomQuery = (url, queryKey = [], options = {}) => {
  return useQuery({
    queryKey,
    queryFn: () => get(url),
    ...options,
  });
};

export default useCustomQuery;
