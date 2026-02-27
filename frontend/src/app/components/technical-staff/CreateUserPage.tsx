import { useState } from 'react';
import { useNavigate } from 'react-router';

export function CreateUserPage() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'student' | 'staff'>('student');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Student Form Data
  const [studentData, setStudentData] = useState({
    name: '',
    email: '',
    hostelId: '',
    password: '',
    confirmPassword: '',
  });

  // Staff Form Data
  const [staffData, setStaffData] = useState({
    name: '',
    email: '',
    department: '',
    role: '',
    password: '',
    confirmPassword: '',
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!studentData.name || !studentData.email || !studentData.hostelId || !studentData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (studentData.password !== studentData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (studentData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Student created:', studentData);
      setSuccess('Student created successfully!');
      setStudentData({ name: '', email: '', hostelId: '', password: '', confirmPassword: '' });
      setSubmitting(false);
    }, 500);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!staffData.name || !staffData.email || !staffData.department || !staffData.role || !staffData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (staffData.password !== staffData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (staffData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Staff created:', staffData);
      setSuccess('Staff member created successfully!');
      setStaffData({ name: '', email: '', department: '', role: '', password: '', confirmPassword: '' });
      setSubmitting(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* User Type Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex gap-4">
          <button
            onClick={() => {
              setUserType('student');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              userType === 'student'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Create Student
          </button>
          <button
            onClick={() => {
              setUserType('staff');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              userType === 'staff'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Create Staff
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6">
          {userType === 'student' ? 'Student Information' : 'Staff Information'}
        </h3>

        {userType === 'student' ? (
          <form onSubmit={handleCreateStudent} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                value={studentData.name}
                onChange={(e) => setStudentData({ ...studentData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter student's full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={studentData.email}
                onChange={(e) => setStudentData({ ...studentData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="student@university.edu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Hostel ID / Room Number
              </label>
              <input
                type="text"
                value={studentData.hostelId}
                onChange={(e) => setStudentData({ ...studentData, hostelId: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., A-204"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={studentData.password}
                onChange={(e) => setStudentData({ ...studentData, password: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={studentData.confirmPassword}
                onChange={(e) =>
                  setStudentData({ ...studentData, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Confirm password"
              />
            </div>

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

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating Student...' : 'Create Student Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateStaff} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                value={staffData.name}
                onChange={(e) => setStaffData({ ...staffData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter staff member's full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={staffData.email}
                onChange={(e) => setStaffData({ ...staffData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="staff@hostel.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
              <select
                value={staffData.department}
                onChange={(e) => setStaffData({ ...staffData, department: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white cursor-pointer"
              >
                <option value="">Select Department</option>
                <option value="Administration">Administration</option>
                <option value="Security">Security</option>
                <option value="Canteen">Canteen</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Housekeeping">Housekeeping</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <select
                value={staffData.role}
                onChange={(e) => setStaffData({ ...staffData, role: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white cursor-pointer"
              >
                <option value="">Select Role</option>
                <option value="Warden">Warden</option>
                <option value="Security">Security</option>
                <option value="Canteen Staff">Canteen Staff</option>
                <option value="Clerk">Clerk</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={staffData.password}
                onChange={(e) => setStaffData({ ...staffData, password: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={staffData.confirmPassword}
                onChange={(e) => setStaffData({ ...staffData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Confirm password"
              />
            </div>

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

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating Staff...' : 'Create Staff Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}