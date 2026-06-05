// API service functions for notifications endpoints
import { apiRequest, APIError } from '../utils/api';

/**
 * Get all notifications for current user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - Array of notifications
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    const res = await apiRequest(`/api/v1/notifications/unread-count/${userId}`);
    return res?.count ?? 0;
  } catch {
    return 0;
  }
};

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

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @returns {Promise<object>} - Updated notification
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    return await apiRequest(`/api/v1/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  } catch (error) {
    console.warn('Failed to mark notification as read:', error);
    return { success: false };
  }
};

/**
 * Mark all notifications as read for a user
 * @param {number} userId - User ID
 * @returns {Promise<object>} - Success response
 */
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
