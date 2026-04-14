import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patch, post, remove } from '@/api';

const invalidateQueryKeys = async (queryClient, invalidateKeys = []) => {
  await Promise.all(
    invalidateKeys.map((key) =>
      queryClient.invalidateQueries({
        queryKey: Array.isArray(key) ? key : [key],
      })
    )
  );
};

export const useCustomPost = (url, invalidateKeys = []) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => post(url, data),
    onSuccess: async (...args) => {
      await invalidateQueryKeys(queryClient, invalidateKeys);
      return args;
    },
  });
};

export const useCustomPatch = (url, invalidateKeys = []) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => patch(url, data),
    onSuccess: async (...args) => {
      await invalidateQueryKeys(queryClient, invalidateKeys);
      return args;
    },
  });
};

export const useCustomRemove = (url, invalidateKeys = []) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => remove(url),
    onSuccess: async (...args) => {
      await invalidateQueryKeys(queryClient, invalidateKeys);
      return args;
    },
  });
};
