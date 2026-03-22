import { User, UserRole, ApiResponse } from '../types';
import apiClient from './api/client';

/**
 * User Service for profile and user management
 */
export const UserService = {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/users/me');
    if (!response.data.data) throw new Error('Failed to fetch profile');
    return response.data.data;
  },

  /**
   * Update current user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>('/users/me', data);
    if (!response.data.data) throw new Error('Failed to update profile');
    return response.data.data;
  },

  /**
   * Change password
   */
  async changePassword(data: any): Promise<void> {
    await apiClient.put('/users/me/password', data);
  },

  /**
   * Upload avatar
   */
  async uploadAvatar(imageUri: string): Promise<string> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);
    
    const response = await apiClient.post<ApiResponse<{ profileImage: string }>>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    if (!response.data.data?.profileImage) throw new Error('Failed to upload avatar');
    return response.data.data.profileImage;
  },

  /**
   * Get students list (admin+)
   */
  async getStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    course?: string;
    pendingFees?: boolean;
    role?: UserRole; // added role support
  }): Promise<{ data: User[]; total: number }> {
     // Defaulting to Student role if not specified, since function is getStudents
    const queryParams = { ...params, role: params?.role || UserRole.STUDENT };
    const response = await apiClient.get<ApiResponse<User[]>>('/users', { params: queryParams });
    return {
      data: response.data.data || [],
      total: response.data.meta?.total || 0,
    };
  },

  /**
   * Get student by ID
   */
  async getStudent(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(`/users/students/${id}`);
    if (!response.data.data) throw new Error('Failed to fetch student');
    return response.data.data;
  },

  /**
   * Create new student (admin+)
   */
  async createStudent(data: Partial<User> & { password: string }): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>('/users/students', { ...data, role: UserRole.STUDENT });
    if (!response.data.data) throw new Error('Failed to create student');
    return response.data.data;
  },

  /**
   * Update student (admin+)
   */
  async updateStudent(id: string, data: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(`/users/students/${id}`, data);
    if (!response.data.data) throw new Error('Failed to update student');
    return response.data.data;
  },

  /**
   * Delete student (super-admin only)
   */
  async deleteStudent(id: string): Promise<void> {
    await apiClient.delete(`/users/students/${id}`);
  },

  /**
   * Get admins/receptionists list (super-admin only)
   */
  async getStaff(): Promise<User[]> {
    const response = await apiClient.get<ApiResponse<User[]>>('/users', { 
        params: { role: [UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN].join(','), limit: 100 } 
    });
    return response.data.data || [];
  },

  /**
   * Assign role to user (super-admin only)
   */
  async assignRole(userId: string, role: UserRole): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${userId}/role`, { role });
    if (!response.data.data) throw new Error('Failed to assign role');
    return response.data.data;
  },

  /**
   * Create staff member (super-admin only)
   */
  async createStaff(data: Partial<User> & { password?: string, role: UserRole }): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>('/users/staff', data);
    if (!response.data.data) throw new Error('Failed to create staff');
    return response.data.data;
  },

  /**
   * Update staff member (super-admin only)
   */
  async updateStaff(id: string, data: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(`/users/staff/${id}`, data);
    if (!response.data.data) throw new Error('Failed to update staff');
    return response.data.data;
  },

  /**
   * Delete staff member (super-admin only)
   */
  async deleteStaff(id: string): Promise<void> {
    await apiClient.delete(`/users/staff/${id}`);
  },

  /**
   * Get users pending approval (super-admin only)
   */
  async getPendingUsers(): Promise<User[]> {
    const response = await apiClient.get<ApiResponse<User[]>>('/users/pending');
    return response.data.data || [];
  },

  /**
   * Approve a pending user account (super-admin only)
   */
  async approveUser(id: string): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>(`/users/${id}/approve`);
    if (!response.data.data) throw new Error('Failed to approve user');
    return response.data.data;
  },

  /**
   * Reject/suspend a pending user account (super-admin only)
   */
  async rejectUser(id: string): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>(`/users/${id}/reject`);
    if (!response.data.data) throw new Error('Failed to reject user');
    return response.data.data;
  },
};

export default UserService;


