import { useState, useEffect } from 'react';

interface Role {
  id: string;
  roleName: string;
  description: string;
  createdAt: string;
}

// Dummy data
const dummyRoles = [
  { id: '1', roleName: 'Admin', description: 'System administrator with full access', createdAt: '2026-01-01T00:00:00Z' },
  { id: '2', roleName: 'Student', description: 'Hostel resident student', createdAt: '2026-01-01T00:00:00Z' },
  { id: '3', roleName: 'Clerk', description: 'Administrative clerk', createdAt: '2026-01-01T00:00:00Z' },
  { id: '4', roleName: 'Warden', description: 'Hostel warden', createdAt: '2026-01-01T00:00:00Z' },
  { id: '5', roleName: 'Security', description: 'Security personnel', createdAt: '2026-01-01T00:00:00Z' },
  { id: '6', roleName: 'Canteen Staff', description: 'Canteen worker', createdAt: '2026-01-01T00:00:00Z' },
];

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setRoles(dummyRoles);
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">System Roles</h3>
        </div>

        {roles.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-500">No data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Role Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{role.roleName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{role.description}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{new Date(role.createdAt).toLocaleDateString()}</td>
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