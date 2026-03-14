import { useState } from "react";

interface Staff {
  USER_ID: number;
  EMP_ID?: string;
  EMAIL?: string;
  ROLE_NAME: string;
}

const DUMMY_STAFF: Staff[] = [
  { USER_ID: 2, EMP_ID: "EMP001", EMAIL: "warden@example.com", ROLE_NAME: "Warden" },
  { USER_ID: 4, EMP_ID: "EMP002", EMAIL: "security@example.com", ROLE_NAME: "Security" },
  { USER_ID: 6, EMP_ID: "EMP003", EMAIL: "canteen@example.com", ROLE_NAME: "Canteen Owner" },
  { USER_ID: 8, EMP_ID: "EMP004", EMAIL: "tech@example.com", ROLE_NAME: "Technical Staff" },
];

export function StaffPage() {
  const [staff] = useState<Staff[]>(DUMMY_STAFF);
  const [loading] = useState(false);

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
          <h3 className="text-lg font-bold text-slate-900">Staff Members (Demo Mode)</h3>
        </div>

        {staff.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-500">No data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Employee ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {staff.map((member) => (
                  <tr key={member.USER_ID} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{member.EMP_ID || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{member.EMAIL || "-"}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-teal-100 text-teal-700 rounded">
                        {member.ROLE_NAME}
                      </span>
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

