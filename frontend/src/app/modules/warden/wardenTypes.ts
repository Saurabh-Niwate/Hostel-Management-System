export interface Room {
  roomNo: string;
  capacity: number;
  occupied: number;
  floor: string;
  block: string;
}

export interface Student {
  id: string;
  studentId: string;
  name: string;
  roomNo: string;
  course: string;
  contact: string;
  parentContact: string;
  email: string;
}

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  roomNo: string;
  date: string;
  status: 'Present' | 'Absent';
}

export interface LeaveRequest {
  id: string;
  studentName: string;
  studentId: string;
  roomNo: string;
  leaveFrom: string;
  leaveTo: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string;
}

export interface DashboardMetrics {
  totalRooms: number;
  totalStudents: number;
  attendanceMarkedToday: number;
  pendingRooms: number;
}
