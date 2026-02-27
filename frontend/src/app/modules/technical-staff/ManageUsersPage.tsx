import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

// Dummy data
const dummyUsers = [
  { id: '1', name: 'Alice Johnson', email: 'alice@university.edu', role: 'Student', createdAt: '2026-02-20T10:00:00Z' },
  { id: '2', name: 'Bob Smith', email: 'bob@university.edu', role: 'Student', createdAt: '2026-02-21T11:30:00Z' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@university.edu', role: 'Student', createdAt: '2026-02-22T08:00:00Z' },
  { id: '4', name: 'Diana Prince', email: 'diana@university.edu', role: 'Student', createdAt: '2026-02-23T09:30:00Z' },
  { id: '5', name: 'Ethan Hunt', email: 'ethan@university.edu', role: 'Student', createdAt: '2026-02-24T10:15:00Z' },
  { id: '6', name: 'Carol Davis', email: 'carol@hostel.com', role: 'Staff', createdAt: '2026-02-22T09:15:00Z' },
  { id: '7', name: 'David Wilson', email: 'david@hostel.com', role: 'Staff', createdAt: '2026-02-23T14:20:00Z' },
  { id: '8', name: 'Emma Thompson', email: 'emma@hostel.com', role: 'Staff', createdAt: '2026-02-24T08:45:00Z' },
];

export function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      let filteredUsers = [...dummyUsers];
      
      // Apply search filter
      if (searchQuery) {
        filteredUsers = filteredUsers.filter(user =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply role filter
      if (roleFilter) {
        filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
      }
      
      setUsers(filteredUsers);
      setLoading(false);
    }, 300);
  }, [searchQuery, roleFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Roles</option>
              <option value="Student">Student</option>
              <option value="Staff">Staff</option>
              <option value="Warden">Warden</option>
              <option value="Security">Security</option>
              <option value="Clerk">Clerk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">All Users</h3>
        </div>

        {users.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-500">No data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-teal-100 text-teal-700 rounded">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-teal-600 hover:text-teal-700 font-medium">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}