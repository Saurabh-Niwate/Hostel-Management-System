import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, Calendar, TrendingUp } from "lucide-react";
import { api } from "../../lib/api";

type Row = {
  ATTENDANCE_DATE: string;
  STATUS: "Present" | "Absent" | "Late";
};

export function AttendanceView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/student/attendance");
        setRows(res.data.attendance || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load attendance");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const totalDays = rows.length;
    const presentDays = rows.filter((r) => r.STATUS === "Present").length;
    const absentDays = rows.filter((r) => r.STATUS === "Absent").length;
    const percentage = totalDays ? Number(((presentDays / totalDays) * 100).toFixed(2)) : 0;
    return { totalDays, presentDays, absentDays, percentage };
  }, [rows]);

  if (loading) return <div className="flex items-center justify-center h-64">Loading attendance...</div>;

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card icon={<TrendingUp className="text-blue-500 mb-2" size={32} />} label="Overall Percentage" value={`${stats.percentage}%`} />
        <Card icon={<Calendar className="text-slate-500 mb-2" size={32} />} label="Total Days" value={String(stats.totalDays)} />
        <Card icon={<CheckCircle2 className="text-emerald-500 mb-2" size={32} />} label="Present Days" value={String(stats.presentDays)} />
        <Card icon={<XCircle className="text-red-500 mb-2" size={32} />} label="Absent Days" value={String(stats.absentDays)} />
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-800">Recent Attendance</h3></div>
        <div className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <div className="p-6 text-slate-500">No attendance records found.</div>
          ) : (
            rows.map((r, i) => (
              <div key={`${r.ATTENDANCE_DATE}-${i}`} className="p-4 flex items-center justify-between">
                <p className="font-medium text-slate-800">{r.ATTENDANCE_DATE}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${r.STATUS === "Present" ? "bg-emerald-100 text-emerald-700" : r.STATUS === "Late" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                  {r.STATUS}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
      {icon}
      <h3 className="text-slate-500 text-sm font-medium">{label}</h3>
      <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
    </div>
  );
}

