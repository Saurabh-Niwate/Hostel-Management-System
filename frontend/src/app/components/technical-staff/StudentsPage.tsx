import { useState, useEffect } from "react";
import { api } from "../../lib/api";

interface Student {
  USER_ID: number;
  STUDENT_ID: string;
  EMAIL?: string;
  FULL_NAME?: string;
  ROOM_NO?: string;
}

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/technical-staff/students");
        setStudents(res.data?.students || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load students");
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Student ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((student) => (
                  <tr key={student.USER_ID} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{student.STUDENT_ID || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{student.FULL_NAME || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.EMAIL || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.ROOM_NO || "-"}</td>
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
