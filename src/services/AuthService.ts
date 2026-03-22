import { User, ApiResponse, AuthResponse, UserRole } from '../types';

import apiClient from './api/client';

// Removed mock delay and base URL
// const API_BASE_URL = 'http://localhost:3000/v1';
// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Authentication Service
 */
export const AuthService = {
  /**
   * Login with email, password
   */
  async login(email: string, password: string, role?: UserRole): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Login failed');
    }
    return response.data.data;
  },

  /**
   * Sign up new user — returns a pending message (account must be approved before login)
   */
  async signup(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
    profileImageUri?: string;
  }): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('password', data.password);
    if (data.phone) formData.append('phone', data.phone);
    if (data.role) formData.append('role', data.role);
    if (data.profileImageUri) {
      formData.append('profileImage', {
        uri: data.profileImageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);
    }

    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/signup', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Signup failed');
    }
    return { message: response.data.data?.message || 'Account created. Awaiting approval.' };
  },

  /**
   * Google OAuth authentication
   */
  async googleAuth(idToken: string): Promise<AuthResponse> {
    // Assuming backend has a specific endpoint for Google Auth, often /auth/google
    // or passing idToken to login
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/google', { idToken });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Google Auth failed');
    }
    return response.data.data;
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await apiClient.post<ApiResponse<{ accessToken: string, refreshToken: string }>>('/auth/refresh', { refreshToken });
    const data = response.data.data;
    if (!data) throw new Error('Failed to refresh token');
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  },

  /**
   * Logout
   */
  async logout(refreshToken?: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post(`/auth/reset-password`, { token, password: newPassword });
  },
};

export default AuthService;
