import { useState, useEffect } from "react";
import { api } from "../../lib/api";

interface Role {
  ROLE_ID: number;
  ROLE_NAME: string;
}

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/technical-staff/roles");
        setRoles(res.data?.roles || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load roles");
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
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Role ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Role Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {roles.map((role) => (
                  <tr key={role.ROLE_ID} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{role.ROLE_ID}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{role.ROLE_NAME}</td>
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
