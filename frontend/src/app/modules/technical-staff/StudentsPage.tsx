import { useState, useEffect } from 'react';

interface Student {
  id: string;
  studentId: string;
  name: string;
  email: string;
  hostelId: string;
  createdAt: string;
}

// Dummy data
const dummyStudents = [
  { id: '1', studentId: 'STU001', name: 'Alice Johnson', email: 'alice@university.edu', hostelId: 'H-101', createdAt: '2026-02-20T10:00:00Z' },
  { id: '2', studentId: 'STU002', name: 'Bob Smith', email: 'bob@university.edu', hostelId: 'H-102', createdAt: '2026-02-21T11:30:00Z' },
  { id: '3', studentId: 'STU003', name: 'Charlie Brown', email: 'charlie@university.edu', hostelId: 'H-103', createdAt: '2026-02-22T08:00:00Z' },
  { id: '4', studentId: 'STU004', name: 'Diana Prince', email: 'diana@university.edu', hostelId: 'H-104', createdAt: '2026-02-23T09:30:00Z' },
  { id: '5', studentId: 'STU005', name: 'Ethan Hunt', email: 'ethan@university.edu', hostelId: 'H-105', createdAt: '2026-02-24T10:15:00Z' },
  { id: '6', studentId: 'STU006', name: 'Fiona Gallagher', email: 'fiona@university.edu', hostelId: 'H-106', createdAt: '2026-02-25T11:00:00Z' },
];

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setStudents(dummyStudents);
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
          <h3 className="text-lg font-bold text-slate-900">Students</h3>
        </div>

        {students.length === 0 ? (
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Hostel ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.hostelId || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(student.createdAt).toLocaleDateString()}
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