/**
 * Enterprise API Service Client for Sage & Bloom E-Commerce Platform
 * Connects React Frontend & Admin Panel with Spring Boot 3.x Backend
 * Supports JWT Token Management, Auto Refresh Token Rotation (RTR), and Offline Fallback
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token') || null;
    this.refreshToken = localStorage.getItem('refresh_token') || null;
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }

  setSession(tokens) {
    if (tokens?.accessToken) {
      this.token = tokens.accessToken;
      localStorage.setItem('auth_token', tokens.accessToken);
    }
    if (tokens?.refreshToken) {
      this.refreshToken = tokens.refreshToken;
      localStorage.setItem('refresh_token', tokens.refreshToken);
    }
  }

  clearSession() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  getToken() {
    return this.token || localStorage.getItem('auth_token');
  }

  getRefreshToken() {
    return this.refreshToken || localStorage.getItem('refresh_token');
  }

  onRefreshed(token) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  addRefreshSubscriber(callback) {
    this.refreshSubscribers.push(callback);
  }

  async request(endpoint, options = {}, retryCount = 0) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized with automatic Refresh Token Rotation
      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh') && retryCount === 0) {
        const currentRefreshToken = this.getRefreshToken();
        if (currentRefreshToken) {
          if (!this.isRefreshing) {
            this.isRefreshing = true;
            try {
              const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: currentRefreshToken }),
              });
              const refreshData = await refreshRes.json();

              if (refreshRes.ok && refreshData?.data?.accessToken) {
                this.setSession(refreshData.data);
                this.onRefreshed(refreshData.data.accessToken);
              } else {
                this.clearSession();
                throw new Error('Session expired. Please log in again.');
              }
            } catch (refreshErr) {
              this.clearSession();
              throw refreshErr;
            } finally {
              this.isRefreshing = false;
            }
          }

          // Return retry promise queued on token refresh
          return new Promise((resolve, reject) => {
            this.addRefreshSubscriber(async (newToken) => {
              try {
                const retryOptions = {
                  ...options,
                  headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${newToken}`,
                  },
                };
                const retryRes = await this.request(endpoint, retryOptions, retryCount + 1);
                resolve(retryRes);
              } catch (err) {
                reject(err);
              }
            });
          });
        } else {
          this.clearSession();
        }
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data?.message || data?.error?.message || `HTTP error ${response.status}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      // Graceful fallback logging
      console.warn(`[API] Request to ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  // --- Authentication ---
  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res?.data) {
      this.setSession(res.data);
    }
    return res.data;
  }

  async register(userData) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (res?.data) {
      this.setSession(res.data);
    }
    return res.data;
  }

  async logout() {
    const rToken = this.getRefreshToken();
    try {
      if (rToken) {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: rToken }),
        });
      }
    } catch (e) {
      console.warn('[API] Logout request error:', e.message);
    } finally {
      this.clearSession();
    }
  }

  async logoutAll() {
    try {
      await this.request('/auth/logout-all', { method: 'POST' });
    } finally {
      this.clearSession();
    }
  }

  async getProfile() {
    return this.request('/users/me');
  }

  // --- Public Products & Categories ---
  async getProducts(search = '', category = '') {
    let query = '';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'all') params.append('category', category);
    if (params.toString()) query = `?${params.toString()}`;
    return this.request(`/products${query}`);
  }

  async getProductById(id) {
    return this.request(`/products/${id}`);
  }

  async getProductBySlug(slug) {
    return this.request(`/products/slug/${slug}`);
  }

  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getCategories() {
    return this.request('/categories');
  }

  async createCategory(categoryData) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  // --- Orders & Checkout ---
  async checkout(orderData) {
    return this.request('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getMyOrders() {
    return this.request('/orders/my-orders');
  }

  async getOrderById(id) {
    return this.request(`/orders/${id}`);
  }

  // --- Admin Operations ---
  async getAdminDashboard() {
    return this.request('/admin/dashboard').catch(() => ({ data: null }));
  }

  async getAdminProducts() {
    return this.request('/admin/products').catch(() => this.getProducts());
  }

  async createAdminProduct(productData) {
    try {
      return await this.request('/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
    } catch (err) {
      console.warn('[API] /admin/products fallback to /products:', err.message);
      return this.request('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
    }
  }

  async updateAdminProduct(id, productData) {
    try {
      return await this.request(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });
    } catch (err) {
      console.warn(`[API] /admin/products/${id} fallback to /products/${id}:`, err.message);
      return this.request(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });
    }
  }

  async deleteAdminProduct(id) {
    try {
      return await this.request(`/admin/products/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      return this.request(`/products/${id}`, {
        method: 'DELETE',
      });
    }
  }

  async deleteAdminProductPermanent(id) {
    try {
      return await this.request(`/admin/products/${id}/permanent`, {
        method: 'DELETE',
      });
    } catch (err) {
      return this.request(`/products/${id}/permanent`, {
        method: 'DELETE',
      });
    }
  }

  async createAdminCategory(categoryData) {
    try {
      return await this.request('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData),
      });
    } catch (err) {
      return this.request('/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData),
      });
    }
  }

  async getAdminOrders() {
    try {
      return await this.request('/admin/orders');
    } catch (err) {
      console.warn('[API] /admin/orders fallback to /orders:', err.message);
      return this.request('/orders');
    }
  }

  async getAdminOrderById(id) {
    try {
      return await this.request(`/admin/orders/${id}`);
    } catch (err) {
      return this.request(`/orders/${id}`);
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      return await this.request(`/admin/orders/${orderId}/status?status=${status}`, {
        method: 'PATCH',
      });
    } catch (err) {
      return this.request(`/orders/${orderId}/status?status=${status}`, {
        method: 'PATCH',
      });
    }
  }

  async getAdminUsers() {
    return this.request('/admin/users');
  }

  async updateUserRole(userId, roleName) {
    return this.request(`/admin/users/${userId}/roles`, {
      method: 'PATCH',
      body: JSON.stringify({ roleName }),
    });
  }

  async updateUserStatus(userId, status) {
    return this.request(`/admin/users/${userId}/status?status=${status}`, {
      method: 'PATCH',
    });
  }

  async getAuditLogs() {
    return this.request('/admin/audit-logs');
  }
}

export const api = new ApiService();
export default api;
