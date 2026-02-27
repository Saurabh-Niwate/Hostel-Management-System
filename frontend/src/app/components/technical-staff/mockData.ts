import { User, Student, Staff, CreateStudentInput, CreateStaffInput } from './types';

// In-memory storage for mock data
let users: User[] = [
  {
    id: '1',
    role: 'student',
    studentId: 'STU001',
    name: 'Alice Johnson',
    email: 'alice@university.edu',
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-20T10:00:00Z',
  },
  {
    id: '2',
    role: 'student',
    studentId: 'STU002',
    name: 'Bob Smith',
    createdAt: '2026-02-21T11:30:00Z',
    updatedAt: '2026-02-21T11:30:00Z',
  },
  {
    id: '3',
    role: 'student',
    studentId: 'STU003',
    name: 'Charlie Brown',
    email: 'charlie@university.edu',
    createdAt: '2026-02-22T08:00:00Z',
    updatedAt: '2026-02-22T08:00:00Z',
  },
  {
    id: '4',
    role: 'student',
    studentId: 'STU004',
    name: 'Diana Prince',
    email: 'diana@university.edu',
    createdAt: '2026-02-23T09:30:00Z',
    updatedAt: '2026-02-23T09:30:00Z',
  },
  {
    id: '5',
    role: 'student',
    studentId: 'STU005',
    name: 'Ethan Hunt',
    createdAt: '2026-02-24T10:15:00Z',
    updatedAt: '2026-02-24T10:15:00Z',
  },
  {
    id: '6',
    role: 'student',
    studentId: 'STU006',
    name: 'Fiona Gallagher',
    email: 'fiona@university.edu',
    createdAt: '2026-02-25T11:00:00Z',
    updatedAt: '2026-02-25T11:00:00Z',
  },
  {
    id: '7',
    role: 'staff',
    employeeId: 'EMP001',
    name: 'Carol Davis',
    email: 'carol@hostel.com',
    createdAt: '2026-02-22T09:15:00Z',
    updatedAt: '2026-02-22T09:15:00Z',
  },
  {
    id: '8',
    role: 'staff',
    employeeId: 'EMP002',
    name: 'David Wilson',
    email: 'david@hostel.com',
    createdAt: '2026-02-23T14:20:00Z',
    updatedAt: '2026-02-23T14:20:00Z',
  },
  {
    id: '9',
    role: 'staff',
    employeeId: 'EMP003',
    name: 'Emma Thompson',
    email: 'emma@hostel.com',
    createdAt: '2026-02-24T08:45:00Z',
    updatedAt: '2026-02-24T08:45:00Z',
  },
  {
    id: '10',
    role: 'staff',
    employeeId: 'EMP004',
    name: 'Frank Miller',
    email: 'frank@hostel.com',
    createdAt: '2026-02-25T13:30:00Z',
    updatedAt: '2026-02-25T13:30:00Z',
  },
  {
    id: '11',
    role: 'staff',
    employeeId: 'EMP005',
    name: 'Grace Lee',
    email: 'grace@hostel.com',
    createdAt: '2026-02-26T10:00:00Z',
    updatedAt: '2026-02-26T10:00:00Z',
  },
];

// Service functions - NO API calls, just direct data manipulation
export const getUsers = (): User[] => {
  return [...users];
};

export const getUserById = (id: string): User | undefined => {
  return users.find((user) => user.id === id);
};

export const createStudent = (input: CreateStudentInput): Student => {
  const newStudent: Student = {
    id: Date.now().toString(),
    role: 'student',
    studentId: input.studentId,
    name: input.name,
    email: input.email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  users.push(newStudent);
  return newStudent;
};

export const createStaff = (input: CreateStaffInput): Staff => {
  const newStaff: Staff = {
    id: Date.now().toString(),
    role: 'staff',
    employeeId: input.employeeId,
    name: input.name,
    email: input.email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  users.push(newStaff);
  return newStaff;
};

export const updateUser = (id: string, updates: Partial<Omit<User,"id"|"role">> ): User | null => {
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return null;
  
  const existingUser = users[index];

if (existingUser.role === "student") {
  users[index] = {
    ...existingUser,
    ...updates,
    role: "student",
    id: existingUser.id,
    updatedAt: new Date().toISOString(),
  };
} else {
  users[index] = {
    ...existingUser,
    ...updates,
    role: "staff",
    id: existingUser.id,
    updatedAt: new Date().toISOString(),
  };
}
  
  return users[index];
};

export const deleteUser = (id: string): boolean => {
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return false;
  
  users.splice(index, 1);
  return true;
};

// Statistics helper
export const getUserStats = () => {
  const students = users.filter((u) => u.role === 'student');
  const staff = users.filter((u) => u.role === 'staff');
  
  return {
    total: users.length,
    students: students.length,
    staff: staff.length,
  };
};
