import { useMemo, useState } from "react";
import { Users, AlertTriangle, UserCheck, TrendingUp } from "lucide-react";

type SummaryRow = {
  STUDENT_ID: string;
  STATUS: "Present" | "Absent" | "Late" | string;
  TOTAL: number;
};

type StudentAgg = {
  studentId: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
};

const DUMMY_SUMMARY: SummaryRow[] = [
  { STUDENT_ID: "STU001", STATUS: "Present", TOTAL: 20 },
  { STUDENT_ID: "STU001", STATUS: "Absent", TOTAL: 2 },
  { STUDENT_ID: "STU002", STATUS: "Present", TOTAL: 15 },
  { STUDENT_ID: "STU002", STATUS: "Absent", TOTAL: 7 },
  { STUDENT_ID: "STU003", STATUS: "Present", TOTAL: 22 },
  { STUDENT_ID: "STU004", STATUS: "Present", TOTAL: 12 },
  { STUDENT_ID: "STU004", STATUS: "Absent", TOTAL: 10 },
  { STUDENT_ID: "STU005", STATUS: "Present", TOTAL: 5 },
  { STUDENT_ID: "STU005", STATUS: "Absent", TOTAL: 17 },
];

export function AdminAttendanceSummary() {
  const [rows] = useState<SummaryRow[]>(DUMMY_SUMMARY);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const summary = useMemo(() => {
    const byStudent = new Map<string, StudentAgg>();
    for (const row of rows) {
      const studentId = row.STUDENT_ID || "-";
      if (!byStudent.has(studentId)) {
        byStudent.set(studentId, { studentId, present: 0, absent: 0, late: 0, total: 0, percentage: 0 });
      }
      const agg = byStudent.get(studentId)!;
      const count = Number(row.TOTAL || 0);
      agg.total += count;
      if (row.STATUS === "Present") agg.present += count;
      if (row.STATUS === "Absent") agg.absent += count;
      if (row.STATUS === "Late") agg.late += count;
    }

    const students = Array.from(byStudent.values()).map((s) => ({
      ...s,
      percentage: s.total > 0 ? Number(((s.present / s.total) * 100).toFixed(2)) : 0,
    }));

    const totalStudents = students.length;
    const presentToday = students.filter((s) => s.present > 0).length;
    const absentToday = students.filter((s) => s.absent > 0 && s.present === 0).length;
    const overallAttendance = students.length
      ? Number((students.reduce((sum, s) => sum + s.percentage, 0) / students.length).toFixed(2))
      : 0;
    const lowAttendanceList = students.filter((s) => s.percentage < 75).sort((a, b) => a.percentage - b.percentage);

    return {
      overallAttendance,
      totalStudents,
      presentToday,
      absentToday,
      lowAttendanceCount: lowAttendanceList.length,
      lowAttendanceList,
    };
  }, [rows]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Attendance Summary</h2>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 md:items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">From Date</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">To Date</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg" />
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Apply Date Filter</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <TrendingUp size={32} className="text-indigo-500 mb-2" />
          <h3 className="text-slate-500 text-sm font-medium">Overall Attendance</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{summary.overallAttendance}%</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <UserCheck size={32} className="text-emerald-500 mb-2" />
          <h3 className="text-slate-500 text-sm font-medium">Students With Presence</h3>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{summary.presentToday}</p>
          <span className="text-xs text-slate-400 mt-1">out of {summary.totalStudents}</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <Users size={32} className="text-slate-400 mb-2" />
          <h3 className="text-slate-500 text-sm font-medium">Fully Absent Students</h3>
          <p className="text-3xl font-bold text-slate-700 mt-2">{summary.absentToday}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 bg-red-50 flex flex-col items-center justify-center">
          <AlertTriangle size={32} className="text-red-500 mb-2" />
          <h3 className="text-red-700 text-sm font-medium">Below Target (75%)</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">{summary.lowAttendanceCount}</p>
          <span className="text-xs text-red-400 mt-1">Students</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Critical Attendance (Below 75%)</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {summary.lowAttendanceList.map((student) => (
            <div key={student.studentId} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <h4 className="font-bold text-slate-800">{student.studentId}</h4>
                <p className="text-sm text-slate-500">Present: {student.present}, Absent: {student.absent}, Late: {student.late}</p>
              </div>
              <div className="flex items-center">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-bold ${student.percentage < 60 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                    }`}
                >
                  {student.percentage}%
                </span>
              </div>
            </div>
          ))}
          {summary.lowAttendanceList.length === 0 && <div className="p-6 text-slate-500">No critical attendance records.</div>}
        </div>
      </div>
    </div>
  );
}

