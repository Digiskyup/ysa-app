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
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
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
};

export default UserService;


