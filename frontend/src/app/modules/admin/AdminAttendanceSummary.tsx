import { useEffect, useMemo, useState } from "react";
import { Users, AlertTriangle, UserCheck, TrendingUp } from "lucide-react";
import { api } from "../../lib/api";
import { jsonToCsv, downloadCsv } from "../../lib/csv";

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

export function AdminAttendanceSummary() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/attendance/summary", {
        params: {
          groupBy: "student",
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
      });
      setRows(res.data?.summary || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load attendance summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDownload = async () => {
    try {
      const res = await api.get("/admin/attendance/summary", {
        params: { groupBy: "student", dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
      });
      const payload = res.data || {};
      // payload.summary is array of { STUDENT_ID, STATUS, TOTAL }
      const csv = jsonToCsv(payload.summary || [], ["STUDENT_ID", "STATUS", "TOTAL"]);
      const from = dateFrom || "all";
      const to = dateTo || "all";
      downloadCsv(`attendance-summary_${from}_to_${to}.csv`, csv);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to download attendance report");
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Attendance Summary</h2>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 md:items-end">
        <div>
          <label htmlFor="dateFrom" className="block text-xs text-slate-500 mb-1">From Date</label>
          <input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg" />
        </div>
        <div>
          <label htmlFor="dateTo" className="block text-xs text-slate-500 mb-1">To Date</label>
          <input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-600">Apply Date Filter</button>
          <button onClick={() => handleDownload()} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500">Download CSV</button>
        </div>
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
          <span className="text-xs text-slate-500 mt-1">out of {summary.totalStudents}</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <Users size={32} className="text-slate-500 mb-2" />
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
                  className={`px-3 py-1 rounded-full text-sm font-bold ${
                    student.percentage < 60 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
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

