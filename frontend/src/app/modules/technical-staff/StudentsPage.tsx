import { useState } from "react";

interface Student {
  USER_ID: number;
  STUDENT_ID: string;
  EMAIL?: string;
  FULL_NAME?: string;
  ROOM_NO?: string;
}

const DUMMY_STUDENTS: Student[] = [
  { USER_ID: 1, STUDENT_ID: "STU001", EMAIL: "saurabh@example.com", FULL_NAME: "Saurabh Niwate", ROOM_NO: "A-101" },
  { USER_ID: 3, STUDENT_ID: "STU002", EMAIL: "amit@example.com", FULL_NAME: "Amit Shah", ROOM_NO: "A-102" },
  { USER_ID: 5, STUDENT_ID: "STU003", EMAIL: "vijay@example.com", FULL_NAME: "Vijay Kumar", ROOM_NO: "B-205" },
];

export function StudentsPage() {
  const [students] = useState<Student[]>(DUMMY_STUDENTS);
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
          <h3 className="text-lg font-bold text-slate-900">Students (Demo Mode)</h3>
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

