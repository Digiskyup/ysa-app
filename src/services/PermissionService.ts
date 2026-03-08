import { ApprovalRequest, ApprovalStatus, Permission, ApiResponse } from '../types';
import apiClient from './api/client';

/**
 * Permission Service
 */
export const PermissionService = {
  /**
   * Get current user's permissions
   */
  async getMyPermissions(): Promise<string[]> {
    // Assuming endpoint exists based on standard patterns, or permissions are part of user profile?
    // If separate service:
    try {
      const response = await apiClient.get<ApiResponse<Permission>>('/permissions/me');
      return response.data.data?.permissions || [];
    } catch (error) {
       console.warn('Failed to fetch permissions', error);
       return [];
    }
  },

  /**
   * Get approval requests (super-admin only)
   */
  async getApprovals(params?: {
    page?: number;
    limit?: number;
    status?: ApprovalStatus;
  }): Promise<{ data: ApprovalRequest[]; total: number }> {
     const response = await apiClient.get<ApiResponse<ApprovalRequest[]>>('/permissions/approvals', { params });
    return {
      data: response.data.data || [],
      total: response.data.meta?.total || 0,
    };
  },

  /**
   * Process approval request (super-admin only)
   */
  async processApproval(
    id: string,
    status: ApprovalStatus.APPROVED | ApprovalStatus.REJECTED,
    rejectionReason?: string
  ): Promise<ApprovalRequest> {
    const response = await apiClient.put<ApiResponse<ApprovalRequest>>(`/permissions/approvals/${id}`, { status, rejectionReason });
    if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to process approval');
    }
    return response.data.data;
  },

  /**
   * Grant permissions to user (super-admin only)
   */
  async grantPermissions(userId: string, permissions: string[]): Promise<Permission> {
    const response = await apiClient.post<ApiResponse<Permission>>('/permissions/grant', { userId, permissions });
    if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to grant permissions');
    }
    return response.data.data;
  },

  /**
   * Create approval request
   */
  async createApprovalRequest(data: {
    action: string;
    resourceType: string;
    resourceId: string;
    payload: Record<string, unknown>;
  }): Promise<ApprovalRequest> {
    const response = await apiClient.post<ApiResponse<ApprovalRequest>>('/permissions/request-approval', data);
    if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to return approval request');
    }
    return response.data.data;
  },
};

export default PermissionService;
