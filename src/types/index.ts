/**
 * User Roles
 */
export enum UserRole {
  STUDENT = 'student',
  RECEPTIONIST = 'receptionist',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super-admin',
}

/**
 * Fee Payment Frequency
 */
export enum FeeFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  ONE_TIME = 'one-time',
}

/**
 * Payment Status
 */
export enum PaymentStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Payment Mode
 */
export enum PaymentMode {
  CASH = 'cash',
  ONLINE = 'online',
  CHEQUE = 'cheque',
  UPI = 'upi',
}

/**
 * Approval Status
 */
export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Course Information
 */
export interface CourseInfo {
  name: string;
  duration: string;
  startDate: string;
  endDate?: string;
}

/**
 * User Interface
 */
export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  profileImage?: string;
  fcmToken?: string;
  status?: 'pending_approval' | 'active' | 'suspended';
  faceAngleCount?: number;
  faceEnrolledAt?: string;

  // Student-specific fields
  course?: CourseInfo;
  totalFees?: number;
  feesPaid?: number;
  feeFrequency?: FeeFrequency;
  feeAmountPerCycle?: number;
  nextPaymentDue?: string;
  lastPaymentDate?: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * Payment Interface
 */
export interface Payment {
  _id: string;
  studentId: string | User;
  amount: number;
  paymentDate: string;
  paymentMode: PaymentMode;
  receiptNumber: string;
  status: PaymentStatus;
  recordedBy: string | User;
  approvedBy?: string | User;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Permission Interface
 */
export interface Permission {
  _id: string;
  userId: string;
  permissions: string[];
  grantedBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Approval Request Interface
 */
export interface ApprovalRequest {
  _id: string;
  action: string;
  requestedBy: string | User;
  resourceType: string;
  resourceId: string;
  payload: Record<string, unknown>;
  status: ApprovalStatus;
  processedBy?: string | User;
  processedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Notification Interface
 */
export interface AppNotification {
  _id: string;
  title: string;
  body: string;
  type: 'payment' | 'approval' | 'reminder' | 'system';
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

/**
 * API Response Wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Auth Response
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Permission Actions
 */
export const PermissionActions = {
  // Student
  STUDENT_CREATE: 'student:create',
  STUDENT_READ: 'student:read',
  STUDENT_UPDATE: 'student:update',
  STUDENT_DELETE: 'student:delete',

  // Payment
  PAYMENT_RECORD: 'payment:record',
  PAYMENT_READ: 'payment:read',
  PAYMENT_APPROVE: 'payment:approve',
  PAYMENT_REJECT: 'payment:reject',

  // User
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Permission
  PERMISSION_GRANT: 'permission:grant',
  PERMISSION_REVOKE: 'permission:revoke',
} as const;

export type PermissionAction = typeof PermissionActions[keyof typeof PermissionActions];

/**
 * Navigation Types
 */
export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Main: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Approvals: undefined;
  Students: undefined;
  Admins: undefined;
  Payments: undefined;
  Profile: undefined;
  Home: undefined;
  AddPayment: undefined;
};
