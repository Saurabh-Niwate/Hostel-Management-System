import React, { useEffect, useState } from "react";
import { Calendar, Clock, AlertCircle, X, CheckCircle, Trash2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { api } from "../../lib/api";

type LeaveStatus = "Pending" | "Approved" | "Rejected";

interface Leave {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
}

type Props = {
  onLeavesUpdated?: (leaves: Leave[]) => void;
  initialTab?: "list" | "apply";
  onTabChange?: (tab: "list" | "apply") => void;
};

const mapLeave = (row: any): Leave => ({
  id: String(row.LEAVE_ID),
  type: row.LEAVE_TYPE || "Leave",
  startDate: row.FROM_DATE,
  endDate: row.TO_DATE,
  reason: row.REASON || "",
  status: row.STATUS as LeaveStatus,
  appliedOn: row.CREATED_AT ? row.CREATED_AT.split(" ")[0] : "",
});

export function LeaveManagement({ onLeavesUpdated, initialTab = "list", onTabChange }: Props) {
  const [activeTab, setActiveTab] = useState<"list" | "apply">(initialTab);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: "Home Visit",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const loadLeaves = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/leave/my-leaves");
      const mapped = (response.data.leaves || []).map(mapLeave);
      setLeaves(mapped);
      onLeavesUpdated?.(mapped);
      if (mapped.length === 0) {
        setSelectedLeave(null);
        setSelectedLeaveId(null);
      } else if (!selectedLeaveId || !mapped.some((l: Leave) => l.id === selectedLeaveId)) {
        setSelectedLeaveId(mapped[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    onTabChange?.(activeTab);
  }, [activeTab, onTabChange]);

  useEffect(() => {
    const loadLeaveDetail = async () => {
      if (!selectedLeaveId) {
        setSelectedLeave(null);
        return;
      }

      setLoadingDetail(true);
      try {
        const response = await api.get(`/leave/${selectedLeaveId}`);
        setSelectedLeave(mapLeave(response.data.leave || {}));
      } catch (err: any) {
        setSelectedLeave(null);
        setError(err.response?.data?.message || "Failed to fetch leave details");
      } finally {
        setLoadingDetail(false);
      }
    };

    loadLeaveDetail();
  }, [selectedLeaveId]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/leave/apply", {
        leaveType: formData.type,
        fromDate: formData.startDate,
        toDate: formData.endDate,
        reason: formData.reason,
      });
      setFormData({ type: "Home Visit", startDate: "", endDate: "", reason: "" });
      setActiveTab("list");
      await loadLeaves();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to apply leave");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setError("");
    try {
      await api.delete(`/leave/${id}`);
      if (selectedLeaveId === id) {
        setSelectedLeaveId(null);
      }
      await loadLeaves();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to cancel leave");
    }
  };

  const renderDate = (value: string) => {
    if (!value) return "-";
    return format(new Date(value), "MMM d, yyyy");
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {activeTab === "list" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="bg-white p-6 rounded-xl border border-slate-100">Loading leaves...</div>
            ) : leaves.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-slate-100 text-slate-500">
                No leave requests found.
              </div>
            ) : (
              leaves.map((leave) => (
                <motion.div
                  layoutId={leave.id}
                  key={leave.id}
                  onClick={() => setSelectedLeaveId(leave.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedLeaveId === leave.id
                      ? "bg-emerald-50 border-emerald-200 shadow-md ring-1 ring-emerald-700"
                      : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800">{leave.type}</h4>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-1">{leave.reason}</p>
                    </div>
                    <StatusBadge status={leave.status} />
                  </div>
                  <div className="mt-4 flex items-center text-xs text-slate-500 space-x-4">
                    <span className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {renderDate(leave.startDate)} - {renderDate(leave.endDate)}
                    </span>
                    <span className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      Applied: {leave.appliedOn}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedLeaveId ? (
                <motion.div
                  key={selectedLeaveId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-6"
                >
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Leave Details</h3>
                    <button onClick={() => setSelectedLeaveId(null)} className="text-slate-400 hover:text-slate-600">
                      <X size={20} />
                    </button>
                  </div>

                  {loadingDetail || !selectedLeave ? (
                    <div className="text-slate-500 text-sm">Loading leave details...</div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</label>
                        <p className="text-slate-800 font-medium">{selectedLeave.type}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Duration
                        </label>
                        <p className="text-slate-800 font-medium">
                          {renderDate(selectedLeave.startDate)} - {renderDate(selectedLeave.endDate)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reason</label>
                        <p className="text-slate-600 text-sm leading-relaxed mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {selectedLeave.reason}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</label>
                        <div className="mt-1">
                          <StatusBadge status={selectedLeave.status} />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedLeave && selectedLeave.status === "Pending" && (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <button
                        onClick={(e) => handleCancelLeave(selectedLeave.id, e)}
                        className="w-full py-2 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Cancel Leave Request
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded-2xl">
                  <FileText size={48} className="mb-4 text-slate-300" />
                  <p>Select a leave request to view details</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100"
        >
          <form onSubmit={handleApply} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option>Home Visit</option>
                  <option>Sick Leave</option>
                  <option>Emergency</option>
                  <option>Outing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                <textarea
                  rows={4}
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Please provide a detailed reason for your leave request..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: LeaveStatus }) {
  const colors = {
    Pending: "bg-amber-50 text-amber-600 border-amber-200",
    Approved: "bg-emerald-50 text-emerald-600 border-emerald-200",
    Rejected: "bg-red-50 text-red-600 border-red-200",
  };

  const icons = {
    Pending: <Clock size={12} className="mr-1" />,
    Approved: <CheckCircle size={12} className="mr-1" />,
    Rejected: <AlertCircle size={12} className="mr-1" />,
  };

  return (
    <span className={`flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${colors[status]}`}>
      {icons[status]}
      {status}
    </span>
  );
}
