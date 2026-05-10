import useCustomQuery from '@/hooks/useQuery';
import { useCustomPatch, useCustomPost, useCustomRemove } from '@/hooks/useMutation';

export const useNotificationsQuery = (options = {}) => {
  return useCustomQuery('/api/notifications/', ['notifications'], options);
};

export const useNotificationStatsQuery = (options = {}) => {
  return useCustomQuery('/api/notifications/stats/', ['notifications-stats'], options);
};

export const useRegisterFcmToken = (invalidateKeys = [['notifications'], ['notifications-stats']]) => {
  return useCustomPost('/api/fcm-tokens/', invalidateKeys);
};

export const useMarkNotificationRead = (invalidateKeys = [['notifications'], ['notifications-stats']]) => {
  return useCustomPatch((id) => `/api/notifications/${id}/`, invalidateKeys);
};

export const useMarkAllNotificationsRead = (invalidateKeys = [['notifications'], ['notifications-stats']]) => {
  return useCustomPost('/api/notifications/mark-all-read/', invalidateKeys);
};

export const useDeleteNotification = (invalidateKeys = [['notifications'], ['notifications-stats']]) => {
  return useCustomRemove((id) => `/api/notifications/${id}/`, invalidateKeys);
};

export const useClearAllNotifications = (invalidateKeys = [['notifications'], ['notifications-stats']]) => {
  return useCustomRemove('/api/notifications/', invalidateKeys);
};

