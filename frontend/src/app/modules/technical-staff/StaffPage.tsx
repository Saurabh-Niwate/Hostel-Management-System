import { useState, useEffect } from 'react';

interface Staff {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  role: string;
  createdAt: string;
}

// Dummy data
const dummyStaff = [
  { id: '1', employeeId: 'EMP001', name: 'Carol Davis', email: 'carol@hostel.com', department: 'Administration', role: 'Clerk', createdAt: '2026-02-22T09:15:00Z' },
  { id: '2', employeeId: 'EMP002', name: 'David Wilson', email: 'david@hostel.com', department: 'Security', role: 'Security', createdAt: '2026-02-23T14:20:00Z' },
  { id: '3', employeeId: 'EMP003', name: 'Emma Thompson', email: 'emma@hostel.com', department: 'Canteen', role: 'Canteen Staff', createdAt: '2026-02-24T08:45:00Z' },
  { id: '4', employeeId: 'EMP004', name: 'Frank Miller', email: 'frank@hostel.com', department: 'Maintenance', role: 'Warden', createdAt: '2026-02-25T13:30:00Z' },
  { id: '5', employeeId: 'EMP005', name: 'Grace Lee', email: 'grace@hostel.com', department: 'Administration', role: 'Admin', createdAt: '2026-02-26T10:00:00Z' },
];

export function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setStaff(dummyStaff);
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
          <h3 className="text-lg font-bold text-slate-900">Staff Members</h3>
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Department</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{member.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{member.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{member.department || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-teal-100 text-teal-700 rounded">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(member.createdAt).toLocaleDateString()}
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