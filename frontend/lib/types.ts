// User and Auth Types
export type UserRole = 'admin' | 'dept_coordinator' | 'requester' | 'faculty';
export type ApprovalStatus = 'pending' | 'forwarded' | 'approved' | 'rejected' | 'amended';
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type RequesterType = 'class' | 'club';

export interface User {
  user_id: number;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  dept_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Requester {
  requester_id: number;
  user_id: number;
  requester_type: RequesterType;
  class_id?: number;
  club_id?: number;
  created_at: string;
}

export interface Hall {
  hall_id: number;
  hall_name: string;
  capacity: number;
  location?: string;
  facilities: Record<string, any>;
  is_active: boolean;
}

export interface Request {
  request_id: number;
  requester_id: number;
  hall_id: number;
  hall_name?: string;
  hall_location?: string;
  hall_capacity?: number;
  event_title: string;
  event_description?: string;
  event_date: string;
  start_time: string;
  end_time: string;
  expected_attendees?: number;
  purpose?: string;
  dept_status: ApprovalStatus;
  dept_approved_by?: number;
  dept_approved_at?: string;
  dept_remarks?: string;
  admin_status: ApprovalStatus;
  admin_approved_by?: number;
  admin_approved_at?: string;
  admin_remarks?: string;
  requested_at: string;
  is_cancelled: boolean;
}

export interface Booking {
  booking_id: number;
  request_id: number;
  hall_id: number;
  requester_id: number;
  event_title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  created_at: string;
  completed_at?: string;
}

export interface AvailabilitySlot {
  hall_id: number;
  hall_name: string;
  date: string;
  bookings: Booking[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface CreateRequestInput {
  hall_id: number;
  event_title: string;
  event_description?: string;
  event_date: string;
  start_time: string;
  end_time: string;
  expected_attendees?: number;
  purpose?: string;
}

export interface ReviewRequestInput {
  action: 'approve' | 'reject';
  remarks?: string;
}

export interface Department {
  dept_id: number;
  dept_name: string;
  dept_code?: string;
  created_at: string;
}

export interface Class {
  class_id: number;
  class_name: string;
  dept_id: number;
  year: string;
}

export interface Club {
  club_id: number;
  club_name: string;
  dept_id?: number;
  description?: string;
}

export interface HallUsageReport {
  hall_id: number;
  hall_name: string;
  total_bookings: number;
}

export interface DepartmentUsageReport {
  dept_id: number;
  dept_name: string;
  total_requests: number;
}
