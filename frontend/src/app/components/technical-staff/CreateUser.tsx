import { useState } from 'react';
import { UserPlus, Users, Briefcase } from 'lucide-react';
import { createStudent, createStaff } from './mockData';
import { CreateStudentInput, CreateStaffInput } from './types';

interface CreateUserProps {
  onUserCreated?: () => void;
}

export function CreateUser({ onUserCreated }: CreateUserProps) {
  const [userType, setUserType] = useState<'student' | 'staff'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Student form state
  const [studentForm, setStudentForm] = useState<CreateStudentInput>({
    studentId: '',
    name: '',
    email: '',
  });

  // Staff form state
  const [staffForm, setStaffForm] = useState<CreateStaffInput>({
    employeeId: '',
    name: '',
    email: '',
  });

  // Validation
  const validateStudentForm = (): boolean => {
    if (!studentForm.studentId.trim()) {
      setError('Student ID is required');
      return false;
    }
    if (!studentForm.name.trim()) {
      setError('Name is required');
      return false;
    }
    return true;
  };

  const validateStaffForm = (): boolean => {
    if (!staffForm.employeeId.trim()) {
      setError('Employee ID is required');
      return false;
    }
    if (!staffForm.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!staffForm.email.trim()) {
      setError('Email is required for staff');
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(staffForm.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  // Handle student form submission
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateStudentForm()) return;

    setLoading(true);
    try {
      createStudent({
        studentId: studentForm.studentId,
        name: studentForm.name,
        email: studentForm.email || undefined,
      });

      setSuccess('Student created successfully!');
      setStudentForm({ studentId: '', name: '', email: '' });
      
      if (onUserCreated) {
        onUserCreated();
      }
    } catch (err) {
      setError('Failed to create student. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle staff form submission
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateStaffForm()) return;

    setLoading(true);
    try {
      createStaff({
        employeeId: staffForm.employeeId,
        name: staffForm.name,
        email: staffForm.email,
      });

      setSuccess('Staff member created successfully!');
      setStaffForm({ employeeId: '', name: '', email: '' });
      
      if (onUserCreated) {
        onUserCreated();
      }
    } catch (err) {
      setError('Failed to create staff member. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-teal-100 rounded-lg">
          <UserPlus className="w-6 h-6 text-teal-700" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Create New User</h2>
          <p className="text-slate-600 text-sm">Add students or staff members to the system</p>
        </div>
      </div>

      {/* User Type Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setUserType('student');
              setError('');
              setSuccess('');
            }}
            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium transition-all ${
              userType === 'student'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Create Student</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setUserType('staff');
              setError('');
              setSuccess('');
            }}
            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium transition-all ${
              userType === 'staff'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span>Create Staff</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
        {userType === 'student' ? (
          <form onSubmit={handleCreateStudent} className="space-y-5 max-w-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Student Information</h3>

            {/* Student ID - REQUIRED */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Student ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={studentForm.studentId}
                onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g., STU001"
                disabled={loading}
              />
            </div>

            {/* Name - REQUIRED */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={studentForm.name}
                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Enter student's full name"
                disabled={loading}
              />
            </div>

            {/* Email - OPTIONAL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email <span className="text-slate-400 text-xs">(Optional)</span>
              </label>
              <input
                type="email"
                value={studentForm.email}
                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="student@university.edu"
                disabled={loading}
              />
            </div>

            {/* Role - Fixed */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <input
                type="text"
                value="Student"
                disabled
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Student...' : 'Create Student'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateStaff} className="space-y-5 max-w-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Staff Information</h3>

            {/* Employee ID - REQUIRED */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Employee ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={staffForm.employeeId}
                onChange={(e) => setStaffForm({ ...staffForm, employeeId: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g., EMP001"
                disabled={loading}
              />
            </div>

            {/* Name - REQUIRED */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={staffForm.name}
                onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Enter staff member's full name"
                disabled={loading}
              />
            </div>

            {/* Email - REQUIRED */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="staff@hostel.com"
                disabled={loading}
              />
            </div>

            {/* Role - Fixed */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <input
                type="text"
                value="Staff"
                disabled
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Staff...' : 'Create Staff Member'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}