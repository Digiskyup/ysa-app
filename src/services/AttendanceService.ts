import { ApiResponse } from '../types';
import apiClient from './api/client';

export const AttendanceService = {
  async checkStudent(identifier: string): Promise<{ studentName: string }> {
    const response = await apiClient.post<ApiResponse<{ studentName: string }>>('/attendance/check-student', { identifier });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Check student failed');
    }
    return response.data.data;
  },

  async verify(identifier: string, imageUri: string): Promise<{ studentName: string; message: string; attendanceId: string; confidenceScore: number; alreadyMarked?: boolean }> {
    const formData = new FormData();
    formData.append('identifier', identifier);
    formData.append('image', {
      uri: imageUri,
      name: 'attendance.jpg',
      type: 'image/jpeg',
    } as any);

    const response = await apiClient.post<ApiResponse<any>>('/attendance/verify', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Verify failed');
    }
    return response.data.data;
  },

  async manualCheckIn(identifier: string): Promise<{ studentName: string; message: string; attendanceId: string; alreadyMarked?: boolean }> {
    const response = await apiClient.post<ApiResponse<any>>('/attendance/manual', { identifier });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Manual check-in failed');
    }
    return response.data.data;
  },

  async enroll(studentId: string, imageUri: string): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: 'enroll.jpg',
      type: 'image/jpeg',
    } as any);

    const response = await apiClient.post<ApiResponse<any>>(`/attendance/enroll/${studentId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Enroll failed');
    }
    return response.data.data;
  }
};

export default AttendanceService;
