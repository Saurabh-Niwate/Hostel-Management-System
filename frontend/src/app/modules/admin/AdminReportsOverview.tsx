import { useMemo, useState } from "react";
import { Users, Home, AlertCircle, Calendar, TrendingUp } from "lucide-react";

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
};

const DUMMY_OVERVIEW: OverviewResponse = {
  leaveSummary: [
    { STATUS: "Pending", TOTAL: 5 },
    { STATUS: "Approved", TOTAL: 12 },
    { STATUS: "Rejected", TOTAL: 3 },
  ],
  attendanceSummary: [
    { STATUS: "Present", TOTAL: 150 },
    { STATUS: "Absent", TOTAL: 15 },
    { STATUS: "Late", TOTAL: 10 },
  ],
  feeSummary: [
    { STATUS: "Paid", TOTAL: 40 },
    { STATUS: "Partial", TOTAL: 10 },
    { STATUS: "Pending", TOTAL: 5 },
  ],
  feedbackSummary: [
    { STATUS: "Pending", TOTAL: 8 },
    { STATUS: "Resolved", TOTAL: 22 },
  ],
  feeTotals: {
    TOTAL_FEE_AMOUNT: 1000000,
    TOTAL_PAID_AMOUNT: 750000,
    TOTAL_DUE_AMOUNT: 250000,
  },
  pendingFeeStudents: [
    { STUDENT_ID: "STU001", TERM_NAME: "Semester 1", AMOUNT_TOTAL: 50000, AMOUNT_PAID: 25000, AMOUNT_DUE: 25000, DUE_DATE: "2026-04-01", STATUS: "Partial" },
    { STUDENT_ID: "STU005", TERM_NAME: "Semester 1", AMOUNT_TOTAL: 50000, AMOUNT_PAID: 0, AMOUNT_DUE: 50000, DUE_DATE: "2026-04-01", STATUS: "Pending" },
  ],
};

const sumByStatus = (rows: CountRow[] = [], status: string) =>
  rows.filter((r) => r.STATUS === status).reduce((sum, r) => sum + Number(r.TOTAL || 0), 0);

const total = (rows: CountRow[] = []) => rows.reduce((sum, r) => sum + Number(r.TOTAL || 0), 0);

export function AdminReportsOverview() {
  const [data] = useState<OverviewResponse>(DUMMY_OVERVIEW);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const cards = useMemo(() => {
    const leaveTotal = total(data.leaveSummary || []);
    const pendingLeaves = sumByStatus(data.leaveSummary || [], "Pending");
    const attendanceTotal = total(data.attendanceSummary || []);
    const absentTotal = sumByStatus(data.attendanceSummary || [], "Absent");
    const dueAmount = Number(data.feeTotals?.TOTAL_DUE_AMOUNT || 0);

    return { leaveTotal, pendingLeaves, attendanceTotal, absentTotal, dueAmount };
  }, [data]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Reports Overview</h2>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <p className="text-xs text-slate-400 mt-1">Awaiting admin review</p>
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
            <p className="text-xs text-slate-400 mt-1">Absent: {cards.absentTotal}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <TrendingUp className="mr-2 text-indigo-500" size={20} />
          Quick Insights
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-slate-700 font-medium">
              Paid Fee Total: Rs {Number(data.feeTotals?.TOTAL_PAID_AMOUNT || 0).toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-amber-800 font-medium">Pending Feedback: {sumByStatus(data.feedbackSummary || [], "Pending")}</p>
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
              {(data.pendingFeeStudents || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-sm text-slate-500 text-center">
                    No pending student fees found.
                  </td>
                </tr>
              ) : (
                (data.pendingFeeStudents || []).map((row, idx) => (
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

