import { useState, useEffect } from "react";
import { api } from "../../lib/api";

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

export function DashboardOverview() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [rolesRes, studentsRes, staffRes, usersRes] = await Promise.all([
          api.get("/technical-staff/roles"),
          api.get("/technical-staff/students"),
          api.get("/technical-staff/staff"),
          api.get("/technical-staff/users"),
        ]);

        const roles = rolesRes.data?.roles || [];
        const students = studentsRes.data?.students || [];
        const staff = staffRes.data?.staff || [];
        const users = usersRes.data?.users || [];

        setMetrics({
          totalUsers: users.length,
          totalStudents: students.length,
          totalStaff: staff.length,
          totalRoles: roles.length,
        });

        const topUsers = users
          .slice(0, 10)
          .map((u: any) => ({
            label: u.STUDENT_ID || u.EMP_ID || `USER-${u.USER_ID}`,
            email: u.EMAIL || "-",
            roleName: u.ROLE_NAME || "-",
          }));
        setRecentUsers(topUsers);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    load();
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
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
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
                    <td className="px-6 py-4 text-sm text-slate-900">{user.label}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-teal-100 text-teal-700 rounded">
                        {user.roleName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">-</td>
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
