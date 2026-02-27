export interface BaseUser {
  id: string;
  name: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student extends BaseUser {
  role: 'student';
  studentId: string;
  email?: string; // Optional for students
}

export interface Staff extends BaseUser {
  role: 'staff';
  employeeId: string;
  email: string; // Required for staff
}

export type User = Student | Staff;

export interface CreateStudentInput {
  studentId: string;
  name: string;
  email?: string;
}

export interface CreateStaffInput {
  employeeId: string;
  name: string;
  email: string;
}

export type CreateUserInput = CreateStudentInput | CreateStaffInput;
