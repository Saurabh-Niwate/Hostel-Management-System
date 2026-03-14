import { useMemo, useState } from "react";
import { Check, X, Search, Clock, CheckCircle, XCircle } from "lucide-react";

type LeaveRow = {
  LEAVE_ID: number;
  USER_ID: number;
  STUDENT_ID: string;
  FROM_DATE: string;
  TO_DATE: string;
  REASON: string;
  STATUS: "Pending" | "Approved" | "Rejected";
};

const DUMMY_LEAVES: LeaveRow[] = [
  { LEAVE_ID: 1, USER_ID: 101, STUDENT_ID: "STU001", FROM_DATE: "2026-03-10", TO_DATE: "2026-03-15", REASON: "Home Visit", STATUS: "Pending" },
  { LEAVE_ID: 2, USER_ID: 102, STUDENT_ID: "STU002", FROM_DATE: "2026-03-12", TO_DATE: "2026-03-14", REASON: "Wedding", STATUS: "Approved" },
  { LEAVE_ID: 3, USER_ID: 103, STUDENT_ID: "STU003", FROM_DATE: "2026-03-05", TO_DATE: "2026-03-06", REASON: "Medical", STATUS: "Rejected" },
  { LEAVE_ID: 4, USER_ID: 104, STUDENT_ID: "STU004", FROM_DATE: "2026-03-18", TO_DATE: "2026-03-20", REASON: "Emergency", STATUS: "Pending" },
];

export function AdminLeaveManagement() {
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [leaves, setLeaves] = useState<LeaveRow[]>(DUMMY_LEAVES);

  const updateLeaveStatus = (leaveId: number, action: "approve" | "reject") => {
    setActionLoadingId(leaveId);

    // Simulate delay
    setTimeout(() => {
      setLeaves(prev => prev.map(l =>
        l.LEAVE_ID === leaveId
          ? { ...l, STATUS: action === "approve" ? "Approved" : "Rejected" }
          : l
      ));
      setActionLoadingId(null);
    }, 500);
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const matchesSearch = l.STUDENT_ID.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.REASON.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "" || l.STATUS === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leaves, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Leave Applications</h2>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search student ID or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-full"
          />
        </div>
        <select
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
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${leave.STATUS === "Approved"
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
                      <span className="text-slate-400 text-sm italic">Processed</span>
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

