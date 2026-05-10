import { get, post, patch, remove } from '@/api';

export const fetchNotifications = async () => {
  return await get('/api/notifications/');
};

export const fetchNotificationStats = async () => {
  return await get('/api/notifications/stats/');
};

export const registerFcmToken = async (token) => {
  return await post('/api/fcm-tokens/', { token });
};

export const unregisterFcmToken = async (token) => {
  // Backend curl shows DELETE with body; axios supports `data` in config.
  return await remove('/api/fcm-tokens/unregister/', { data: { token } });
};

export const markNotificationRead = async (id) => {
  return await patch(`/api/notifications/${id}/`, { is_read: true });
};

export const markAllNotificationsRead = async () => {
  return await post('/api/notifications/mark-all-read/', {});
};

export const deleteNotification = async (id) => {
  return await remove(`/api/notifications/${id}/`);
};

export const clearAllNotifications = async () => {
  // Backend curl list includes DELETE /api/notifications/ (used here as "clear all")
  return await remove('/api/notifications/');
};

