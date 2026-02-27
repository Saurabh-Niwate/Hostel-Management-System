import { useState, useEffect } from 'react';
import { Users, Edit2, Trash2, Search, X } from 'lucide-react';
import { User, Student, Staff } from './types';
import { getUsers, deleteUser, updateUser } from './mockData';

interface ManageUsersProps {
  refreshTrigger?: number;
}

export function ManageUsers({ refreshTrigger }: ManageUsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'staff'>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    studentId: '',
    employeeId: '',
  });

  // Load users
  const loadUsers = () => {
    setLoading(true);
    try {
      const data = getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [refreshTrigger]);

  // Filter users based on search and role filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.role === 'student' && user.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.role === 'staff' && user.employeeId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = filterRole === 'all' || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  // Handle delete
  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const success = deleteUser(id);
      if (success) {
        setSuccess('User deleted successfully');
        loadUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  // Open edit modal
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email || '',
      studentId: user.role === 'student' ? user.studentId : '',
      employeeId: user.role === 'staff' ? user.employeeId : '',
    });
    setError('');
    setSuccess('');
  };

  // Handle edit form submission
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // Validation
    if (!editForm.name.trim()) {
      setError('Name is required');
      return;
    }

    if (editingUser.role === 'student' && !editForm.studentId.trim()) {
      setError('Student ID is required');
      return;
    }

    if (editingUser.role === 'staff') {
      if (!editForm.employeeId.trim()) {
        setError('Employee ID is required');
        return;
      }
      if (!editForm.email.trim()) {
        setError('Email is required for staff');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email)) {
        setError('Please enter a valid email address');
        return;
      }
    }

    try {
      const updates: Partial<User> = {
        name: editForm.name,
        email: editForm.email || undefined,
      };

      if (editingUser.role === 'student') {
        (updates as Partial<Student>).studentId = editForm.studentId;
      } else {
        (updates as Partial<Staff>).employeeId = editForm.employeeId;
      }

      updateUser(editingUser.id, updates);
      setSuccess('User updated successfully');
      setEditingUser(null);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-teal-100 rounded-lg">
          <Users className="w-6 h-6 text-teal-700" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Manage Users</h2>
          <p className="text-slate-600 text-sm">View, edit, and delete users in the system</p>
        </div>
      </div>

      {/* Success/Error Messages */}
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Role Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterRole('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterRole === 'all'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterRole('student')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterRole === 'student'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setFilterRole('staff')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterRole === 'staff'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Staff
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">ID</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Email</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Role</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Created</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {user.role === 'student'
                        ? (user as Student).studentId
                        : (user as Staff).employeeId}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.email || <span className="text-slate-400 italic">No email</span>}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.role === 'student'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Edit User</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* ID Field (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {editingUser.role === 'student' ? 'Student ID' : 'Employee ID'}
                </label>
                <input
                  type="text"
                  value={editingUser.role === 'student' ? editForm.studentId : editForm.employeeId}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      [editingUser.role === 'student' ? 'studentId' : 'employeeId']: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email{' '}
                  {editingUser.role === 'staff' ? (
                    <span className="text-red-500">*</span>
                  ) : (
                    <span className="text-slate-400 text-xs">(Optional)</span>
                  )}
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Role (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <input
                  type="text"
                  value={editingUser.role.charAt(0).toUpperCase() + editingUser.role.slice(1)}
                  disabled
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}