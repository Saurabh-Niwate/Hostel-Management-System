import { useState } from "react";

type RoleRow = {
  ROLE_ID: number;
  ROLE_NAME: string;
};

const DUMMY_ROLES: RoleRow[] = [
  { ROLE_ID: 1, ROLE_NAME: "Student" },
  { ROLE_ID: 2, ROLE_NAME: "Warden" },
  { ROLE_ID: 3, ROLE_NAME: "Security" },
  { ROLE_ID: 4, ROLE_NAME: "Admin" },
  { ROLE_ID: 5, ROLE_NAME: "Technical Staff" },
];

export function RoleManagementPage() {
  const [userId, setUserId] = useState("");
  const [roleName, setRoleName] = useState(DUMMY_ROLES[0].ROLE_NAME);
  const [roles] = useState<RoleRow[]>(DUMMY_ROLES);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !roleName.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setSuccess(`User role updated to ${roleName} for ${userId} (Demo Mode)`);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Change User Role (Demo Mode)</h3>
        <form onSubmit={handleSubmit} className="space-y-3 max-w-xl">
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID (e.g. STU001)"
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

