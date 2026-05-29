import { useEffect, useMemo, useState } from "react";
import { Users, Home, AlertCircle, Calendar, TrendingUp } from "lucide-react";
import { api } from "../../lib/api";
import { jsonToCsv, downloadCsv } from "../../lib/csv";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

type CountRow = { STATUS: string; TOTAL: number };

type OverviewResponse = {
  leaveSummary: CountRow[];
  attendanceSummary: CountRow[];
  feeSummary: CountRow[];
  feedbackSummary: CountRow[];
  feeTotals: {
    TOTAL_FEE_AMOUNT: number;
    TOTAL_PAID_AMOUNT: number;
    TOTAL_DUE_AMOUNT: number;
  };
  pendingFeeStudents: Array<{
    STUDENT_ID: string;
    TERM_NAME: string;
    AMOUNT_TOTAL: number;
    AMOUNT_PAID: number;
    AMOUNT_DUE: number;
    DUE_DATE?: string;
    STATUS: string;
  }>;
  roomCapacity?: {
    TOTAL_ROOMS: number;
    TOTAL_CAPACITY: number;
    OCCUPIED_BEDS: number;
    VACANCY: number;
    IS_FULL: boolean;
  };
  occupancyTrend?: Array<{
    BLOCK_NAME: string;
    OCCUPIED: number;
    TOTAL_CAPACITY: number;
  }>;
  feeTrend?: Array<{
    TERM_NAME: string;
    TOTAL_AMOUNT: number;
    PAID_AMOUNT: number;
    DUE_AMOUNT: number;
  }>;
  gatePassActivity?: Array<{
    EXIT_TYPE: string;
    TOTAL: number;
  }>;
};

const sumByStatus = (rows: CountRow[] = [], status: string) =>
  rows.filter((r) => r.STATUS === status).reduce((sum, r) => sum + Number(r.TOTAL || 0), 0);

const total = (rows: CountRow[] = []) => rows.reduce((sum, r) => sum + Number(r.TOTAL || 0), 0);

export function AdminReportsOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/reports/overview", {
        params: {
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
      });
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load report overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDownload = async () => {
    try {
      const res = await api.get("/admin/reports/overview", {
        params: { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
      });
      const payload = res.data || {};

      const parts: string[] = [];
      parts.push("Report Overview");
      parts.push(`Range:,${payload.range?.dateFrom || ""},${payload.range?.dateTo || ""}`);
      parts.push("");

      parts.push("Leave Summary");
      parts.push(jsonToCsv(payload.leaveSummary || [], ["STATUS", "TOTAL"]));
      parts.push("");

      parts.push("Attendance Summary");
      parts.push(jsonToCsv(payload.attendanceSummary || [], ["STATUS", "TOTAL"]));
      parts.push("");

      parts.push("Fee Summary");
      parts.push(jsonToCsv(payload.feeSummary || [], ["STATUS", "TOTAL"]));
      parts.push("");

      parts.push("Fee Totals");
      parts.push(jsonToCsv([payload.feeTotals || {}]));
      parts.push("");

      parts.push("Pending Fee Students");
      parts.push(jsonToCsv(payload.pendingFeeStudents || []));
      parts.push("");

      parts.push("Room Capacity");
      parts.push(jsonToCsv([payload.roomCapacity || {}]));

      const csv = parts.join("\n");
      const from = dateFrom || "all";
      const to = dateTo || "all";
      downloadCsv(`overview-report_${from}_to_${to}.csv`, csv);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to download report");
    }
  };

  const cards = useMemo(() => {
    const leaveTotal = total(data?.leaveSummary || []);
    const pendingLeaves = sumByStatus(data?.leaveSummary || [], "Pending");
    const attendanceTotal = total(data?.attendanceSummary || []);
    const absentTotal = sumByStatus(data?.attendanceSummary || [], "Absent");
    const dueAmount = Number(data?.feeTotals?.TOTAL_DUE_AMOUNT || 0);

    return { leaveTotal, pendingLeaves, attendanceTotal, absentTotal, dueAmount };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Reports Overview</h2>
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
          <button onClick={() => handleDownload()} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500">Download Report (CSV)</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-4 bg-indigo-100 text-indigo-600 rounded-xl">
            <Users size={28} />
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-medium">Total Leave Requests</h3>
            <p className="text-2xl font-bold text-slate-800">{cards.leaveTotal}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-xl">
            <Home size={28} />
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-medium">Pending Leaves</h3>
            <p className="text-2xl font-bold text-slate-800">{cards.pendingLeaves}</p>
            <p className="text-xs text-slate-500 mt-1">Awaiting admin review</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-4 bg-amber-100 text-amber-600 rounded-xl">
            <AlertCircle size={28} />
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-medium">Fee Due Amount</h3>
            <p className="text-2xl font-bold text-slate-800">Rs {cards.dueAmount.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-xl">
            <Calendar size={28} />
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-medium">Attendance Entries</h3>
            <p className="text-2xl font-bold text-slate-800">{cards.attendanceTotal}</p>
            <p className="text-xs text-slate-500 mt-1">Absent: {cards.absentTotal}</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        
        {/* Block Occupancy Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Home size={20} className="mr-2 text-indigo-500" />
            Block-wise Hostel Occupancy
          </h3>
          <div className="h-72 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.occupancyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="BLOCK_NAME" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "#f8fafc" }}
                  itemStyle={{ color: "#38bdf8" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar name="Occupied Beds" dataKey="OCCUPIED" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar name="Total Capacity" dataKey="TOTAL_CAPACITY" fill="#e2e8f0" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fee Collection Trend Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <TrendingUp size={20} className="mr-2 text-indigo-500" />
            Term-wise Fee Breakdown
          </h3>
          <div className="h-72 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.feeTrend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="TERM_NAME" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000) + 'k' : v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "#f8fafc" }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`]}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar name="Total Billed" dataKey="TOTAL_AMOUNT" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar name="Paid" dataKey="PAID_AMOUNT" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar name="Due" dataKey="DUE_AMOUNT" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gate Pass Exits Distribution Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Users size={20} className="mr-2 text-indigo-500" />
            Security Exit Categories
          </h3>
          <div className="h-72 w-full flex-1 flex items-center justify-center">
            {(!data?.gatePassActivity || data.gatePassActivity.length === 0) ? (
              <p className="text-slate-400 text-sm">No exit records logged yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.gatePassActivity}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="TOTAL"
                    nameKey="EXIT_TYPE"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {data.gatePassActivity.map((entry, index) => {
                      const colors = ["#f59e0b", "#10b981"]; // Amber for daily exit, Emerald for approved leave
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} exits`]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Attendance breakdown ratio */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Calendar size={20} className="mr-2 text-indigo-500" />
            Overall Attendance Split
          </h3>
          <div className="h-72 w-full flex-1 flex items-center justify-center">
            {(!data?.attendanceSummary || data.attendanceSummary.length === 0) ? (
              <p className="text-slate-400 text-sm">No attendance records logged yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.attendanceSummary}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={90}
                    dataKey="TOTAL"
                    nameKey="STATUS"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {data.attendanceSummary.map((entry, index) => {
                      const colors: Record<string, string> = {
                        "Present": "#10b981", // Emerald
                        "Absent": "#ef4444",  // Red
                        "Late": "#f59e0b"    // Amber
                      };
                      const fill = colors[entry.STATUS] || "#6366f1";
                      return <Cell key={`cell-${index}`} fill={fill} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} entries`]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <TrendingUp className="mr-2 text-indigo-500" size={20} />
          Quick Insights
        </h3>
        <div className="space-y-4">
          {Boolean(data?.roomCapacity?.IS_FULL) && (
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
              <p className="text-rose-800 font-semibold">Hostel Capacity Full</p>
              <p className="mt-1 text-sm text-rose-700">
                All {Number(data?.roomCapacity?.TOTAL_CAPACITY || 0).toLocaleString()} beds are occupied across{" "}
                {Number(data?.roomCapacity?.TOTAL_ROOMS || 0).toLocaleString()} active rooms. New students may need nearby stay suggestions until rooms are available.
              </p>
            </div>
          )}
          {Boolean(data?.roomCapacity && !data?.roomCapacity?.IS_FULL) && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-blue-800 font-medium">
                Room Vacancy Available: {Number(data?.roomCapacity?.VACANCY || 0).toLocaleString()} bed(s) free
              </p>
              <p className="mt-1 text-sm text-blue-700">
                Occupied {Number(data?.roomCapacity?.OCCUPIED_BEDS || 0).toLocaleString()} of{" "}
                {Number(data?.roomCapacity?.TOTAL_CAPACITY || 0).toLocaleString()} hostel beds.
              </p>
            </div>
          )}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-slate-700 font-medium">
              Paid Fee Total: Rs {Number(data?.feeTotals?.TOTAL_PAID_AMOUNT || 0).toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-amber-800 font-medium">Open Feedback: {sumByStatus(data?.feedbackSummary || [], "Open")}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Pending Student Fees</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Student ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Term</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Due Amount</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Due Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(data?.pendingFeeStudents || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-sm text-slate-500 text-center">
                    No pending student fees found.
                  </td>
                </tr>
              ) : (
                (data?.pendingFeeStudents || []).map((row, idx) => (
                  <tr key={`${row.STUDENT_ID}-${row.TERM_NAME}-${idx}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">{row.STUDENT_ID || "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{row.TERM_NAME || "-"}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-700">Rs {Number(row.AMOUNT_DUE || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{row.DUE_DATE || "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{row.STATUS || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

