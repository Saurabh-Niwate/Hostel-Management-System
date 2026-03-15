import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type RoleRow = {
  ROLE_ID: number;
  ROLE_NAME: string;
};

export function RoleManagementPage() {
  const [userId, setUserId] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await api.get("/technical-staff/roles");
        const rows = res.data?.roles || [];
        setRoles(rows);
        if (rows.length > 0) setRoleName(rows[0].ROLE_NAME);
      } catch {
        setRoles([]);
      }
    };
    loadRoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !roleName.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/technical-staff/users/${userId.trim()}/role`, { roleName: roleName.trim() });
      setSuccess("User role updated successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update user role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Change User Role</h3>
        <form onSubmit={handleSubmit} className="space-y-3 max-w-xl">
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            required
          />
          <select
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            required
          >
            {roles.map((r) => (
              <option key={r.ROLE_ID} value={r.ROLE_NAME}>
                {r.ROLE_NAME}
              </option>
            ))}
          </select>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Updating..." : "Update Role"}
          </button>
        </form>
      </div>
    </div>
  );
}
