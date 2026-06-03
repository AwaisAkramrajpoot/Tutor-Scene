import { apiRequest } from '../utils/api';

const BASE = '/api/v1/on-demand-learning';

export const fetchFeaturedContent = () =>
  apiRequest(`${BASE}/featured`, { method: 'GET' });

export const fetchFilterOptions = () =>
  apiRequest(`${BASE}/filter-options`, { method: 'GET' });

export const fetchContent = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value != null && value !== false) {
      qs.append(key, String(value));
    }
  });
  const query = qs.toString();
  return apiRequest(`${BASE}/content${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const fetchCategories = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value != null && value !== false) {
      qs.append(key, String(value));
    }
  });
  const query = qs.toString();
  return apiRequest(`${BASE}/categories${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const saveContent = (contentId) =>
  apiRequest(`${BASE}/saved/${contentId}`, { method: 'POST' });

export const unsaveContent = (contentId) =>
  apiRequest(`${BASE}/saved/${contentId}`, { method: 'DELETE' });

export const fetchCart = () => apiRequest(`${BASE}/cart`, { method: 'GET' });

export const fetchCartCount = () =>
  apiRequest(`${BASE}/cart/count`, { method: 'GET' });

export const addToCart = (contentId) =>
  apiRequest(`${BASE}/cart`, {
    method: 'POST',
    body: JSON.stringify({ contentId }),
  });

export const removeFromCart = (contentId) =>
  apiRequest(`${BASE}/cart/${contentId}`, { method: 'DELETE' });

export const clearCart = () => apiRequest(`${BASE}/cart`, { method: 'DELETE' });
