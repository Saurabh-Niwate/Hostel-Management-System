import { useState, useEffect } from 'react';

interface DashboardMetrics {
  totalUsers: number;
  totalStudents: number;
  totalStaff: number;
  totalRoles: number;
}

interface RecentUser {
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

// Dummy data
const dummyUsers = [
  { name: 'Alice Johnson', email: 'alice@university.edu', role: 'Student', createdAt: '2026-02-20T10:00:00Z' },
  { name: 'Bob Smith', email: 'bob@university.edu', role: 'Student', createdAt: '2026-02-21T11:30:00Z' },
  { name: 'Carol Davis', email: 'carol@hostel.com', role: 'Staff', createdAt: '2026-02-22T09:15:00Z' },
  { name: 'David Wilson', email: 'david@hostel.com', role: 'Staff', createdAt: '2026-02-23T14:20:00Z' },
  { name: 'Emma Thompson', email: 'emma@hostel.com', role: 'Staff', createdAt: '2026-02-24T08:45:00Z' },
];

const dummyMetrics = {
  totalUsers: 11,
  totalStudents: 6,
  totalStaff: 5,
  totalRoles: 4,
};

export function DashboardOverview() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setMetrics(dummyMetrics);
      setRecentUsers(dummyUsers);
      setLoading(false);
    }, 300);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-teal-600 p-6">
          <p className="text-sm text-slate-600 mb-1">Total Users</p>
          <p className="text-3xl font-bold text-slate-900">{metrics?.totalUsers ?? 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border-l-4 border-teal-600 p-6">
          <p className="text-sm text-slate-600 mb-1">Total Students</p>
          <p className="text-3xl font-bold text-slate-900">{metrics?.totalStudents ?? 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border-l-4 border-teal-600 p-6">
          <p className="text-sm text-slate-600 mb-1">Total Staff</p>
          <p className="text-3xl font-bold text-slate-900">{metrics?.totalStaff ?? 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border-l-4 border-teal-600 p-6">
          <p className="text-sm text-slate-600 mb-1">Total Roles</p>
          <p className="text-3xl font-bold text-slate-900">{metrics?.totalRoles ?? 0}</p>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Recent Users</h3>
        </div>

        {recentUsers.length === 0 ? (
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">
                    Created Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentUsers.map((user, index) => (
                  <tr key={index} className="hover:bg-slate-50">
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