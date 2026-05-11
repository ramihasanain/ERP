import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patch, post, put, remove } from '@/api';

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
    mutationFn: (data) => {
      if (typeof url === 'function') {
        const resolvedUrl = url(data);
        const requestBody =
          data && Object.prototype.hasOwnProperty.call(data, 'body')
            ? data.body
            : data;
        return post(resolvedUrl, requestBody);
      }
      return post(url, data);
    },
    onSuccess: async (...args) => {
      await invalidateQueryKeys(queryClient, invalidateKeys);
      return args;
    },
  });
};

export const useCustomPatch = (url, invalidateKeys = []) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => {
      if (typeof url === 'function') {
        const { id, ...body } = data || {};
        return patch(url(id), body);
      }
      return patch(url, data);
    },
    onSuccess: async (...args) => {
      await invalidateQueryKeys(queryClient, invalidateKeys);
      return args;
    },
  });
};

export const useCustomPut = (url, invalidateKeys = []) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => {
      const resolvedUrl = typeof url === 'function' ? url(data) : url;
      return put(resolvedUrl, data);
    },
    onSuccess: async (...args) => {
      await invalidateQueryKeys(queryClient, invalidateKeys);
      return args;
    },
  });
};

export const useCustomRemove = (url, invalidateKeys = []) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (identifier) => {
      const resolvedUrl = typeof url === 'function' ? url(identifier) : url;
      return remove(resolvedUrl);
    },
    onSuccess: async (...args) => {
      await invalidateQueryKeys(queryClient, invalidateKeys);
      return args;
    },
  });
};
