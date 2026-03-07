import { useState } from "react";

interface DashboardMetrics {
  totalUsers: number;
  totalStudents: number;
  totalStaff: number;
  totalRoles: number;
}

interface RecentUser {
  label: string;
  email: string;
  roleName: string;
}

const DUMMY_METRICS: DashboardMetrics = {
  totalUsers: 10,
  totalStudents: 6,
  totalStaff: 4,
  totalRoles: 6,
};

const DUMMY_RECENT_USERS: RecentUser[] = [
  { label: "STU001", email: "saurabh@example.com", roleName: "Student" },
  { label: "EMP001", email: "warden@example.com", roleName: "Warden" },
  { label: "STU002", email: "amit@example.com", roleName: "Student" },
  { label: "EMP002", email: "security@example.com", roleName: "Security" },
  { label: "STU003", email: "vijay@example.com", roleName: "Student" },
];

export function DashboardOverview() {
  const [metrics] = useState<DashboardMetrics>(DUMMY_METRICS);
  const [recentUsers] = useState<RecentUser[]>(DUMMY_RECENT_USERS);
  const [loading] = useState(false);

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
          <p className="text-3xl font-bold text-slate-900">{metrics.totalUsers}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border-l-4 border-teal-600 p-6">
          <p className="text-sm text-slate-600 mb-1">Total Students</p>
          <p className="text-3xl font-bold text-slate-900">{metrics.totalStudents}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border-l-4 border-teal-600 p-6">
          <p className="text-sm text-slate-600 mb-1">Total Staff</p>
          <p className="text-3xl font-bold text-slate-900">{metrics.totalStaff}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border-l-4 border-teal-600 p-6">
          <p className="text-sm text-slate-600 mb-1">Total Roles</p>
          <p className="text-3xl font-bold text-slate-900">{metrics.totalRoles}</p>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Recent Users (Demo Mode)</h3>
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
                    <td className="px-6 py-4 text-sm text-slate-900">{user.label}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-teal-100 text-teal-700 rounded">
                        {user.roleName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">2026-03-01</td>
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

