import { apiRequest, APIError } from '../utils/api';

export const getNotifications = async (userId) => {
  try {
    return await apiRequest(`/api/v1/notifications/${userId}`);
  } catch (error) {
    if (error instanceof APIError && error.code === 'NETWORK_ERROR') {
      error.message = 'Unable to load notifications. Please check your connection.';
    }
    throw error;
  }
};

export const getUnreadNotificationCount = async (userId) => {
  try {
    const res = await apiRequest(`/api/v1/notifications/unread-count/${userId}`);
    return res?.count ?? 0;
  } catch {
    return 0;
  }
};

export const markNotificationAsRead = async (userId, notificationId) => {
  try {
    return await apiRequest(
      `/api/v1/notifications/user/${userId}/notification/${notificationId}/read`,
      { method: 'PATCH' },
    );
  } catch (error) {
    console.warn('Failed to mark notification as read:', error);
    return { success: false };
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  try {
    return await apiRequest(`/api/v1/notifications/${userId}/read-all`, {
      method: 'PATCH',
    });
  } catch (error) {
    console.warn('Failed to mark all notifications as read:', error);
    return { success: false };
  }
};

export const deleteNotification = async (userId, notificationId) => {
  return apiRequest(
    `/api/v1/notifications/user/${userId}/notification/${notificationId}`,
    { method: 'DELETE' },
  );
};

export const deleteAllNonSystemNotifications = async (userId) => {
  return apiRequest(`/api/v1/notifications/user/${userId}/non-system`, {
    method: 'DELETE',
  });
};
