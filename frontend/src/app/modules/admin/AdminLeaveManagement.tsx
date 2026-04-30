import { useEffect, useMemo, useState } from "react";
import { Check, X, Search, Clock, CheckCircle, XCircle } from "lucide-react";
import { api } from "../../lib/api";

type LeaveRow = {
  LEAVE_ID: number;
  USER_ID: number;
  STUDENT_ID: string;
  FROM_DATE: string;
  TO_DATE: string;
  REASON: string;
  STATUS: "Pending" | "Approved" | "Rejected";
};

export function AdminLeaveManagement() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [leaves, setLeaves] = useState<LeaveRow[]>([]);

  const loadLeaves = async (query?: string, status?: string, opts?: { background?: boolean }) => {
    if (opts?.background) {
      setIsFetching(true);
    } else {
      setInitialLoading(true);
    }
    setError("");
    try {
      const res = await api.get("/admin/leaves", {
        params: {
          q: query || undefined,
          status: status || undefined,
        },
      });
      setLeaves(res.data?.leaves || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load leave applications");
    } finally {
      setIsFetching(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves(undefined, undefined, { background: false });
  }, []);

  useEffect(() => {
    if (initialLoading) return;
    const id = setTimeout(() => {
      loadLeaves(searchQuery.trim() || undefined, statusFilter || undefined, { background: true });
    }, 500);
    return () => clearTimeout(id);
  }, [searchQuery, statusFilter, initialLoading]);

  const updateLeaveStatus = async (leaveId: number, action: "approve" | "reject") => {
    setActionLoadingId(leaveId);
    setError("");
    try {
      if (action === "approve") {
        await api.put(`/admin/leave/${leaveId}/approve`, {});
      } else {
        await api.put(`/admin/leave/${leaveId}/reject`, {});
      }
      await loadLeaves(searchQuery.trim() || undefined, statusFilter || undefined, { background: true });
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} leave`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredLeaves = useMemo(() => leaves, [leaves]);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Leave Applications</h2>
        {isFetching && <p className="text-sm text-slate-500">Searching...</p>}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search student ID or reason..."
            aria-label="Search student ID or reason"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-full"
          />
        </div>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg bg-white"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                <th className="p-4 font-medium">Student</th>
                <th className="p-4 font-medium">Duration</th>
                <th className="p-4 font-medium">Reason</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.map((leave) => (
                <tr key={leave.LEAVE_ID} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{leave.STUDENT_ID || `USER-${leave.USER_ID}`}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-slate-700">{leave.FROM_DATE} to</div>
                    <div className="text-sm font-medium text-slate-700">{leave.TO_DATE}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 max-w-xs truncate">{leave.REASON}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        leave.STATUS === "Approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : leave.STATUS === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {leave.STATUS === "Pending" && <Clock size={12} className="mr-1" />}
                      {leave.STATUS === "Approved" && <CheckCircle size={12} className="mr-1" />}
                      {leave.STATUS === "Rejected" && <XCircle size={12} className="mr-1" />}
                      {leave.STATUS}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {leave.STATUS === "Pending" ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => updateLeaveStatus(leave.LEAVE_ID, "reject")}
                          disabled={actionLoadingId === leave.LEAVE_ID}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 disabled:opacity-50"
                          title="Reject"
                        >
                          <X size={16} />
                        </button>
                        <button
                          onClick={() => updateLeaveStatus(leave.LEAVE_ID, "approve")}
                          disabled={actionLoadingId === leave.LEAVE_ID}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 disabled:opacity-50"
                          title="Approve"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-sm italic">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLeaves.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No leave applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

