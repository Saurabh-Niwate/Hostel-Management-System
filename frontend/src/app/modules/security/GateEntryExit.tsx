import React, { useState } from "react";
import { Search, UserCheck, ShieldAlert, LogIn, LogOut, FileText, Phone, Mail, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../../lib/api";

type StudentStatusResponse = {
  student: {
    studentId: string;
    fullName: string;
    roomNo: string | null;
    phone: string | null;
    email: string | null;
  };
  referenceDate: string;
  currentGateStatus: "OUTSIDE" | "INSIDE";
  activeLeave: null | {
    LEAVE_ID: number;
    LEAVE_TYPE: string;
    FROM_DATE: string;
    TO_DATE: string;
    REASON: string;
    STATUS: string;
  };
  openLog: null | {
    LOG_ID: number;
    EXIT_TIME: string;
    ENTRY_TIME: string | null;
    STATUS: string;
    LEAVE_ID: number | null;
    EXIT_REMARKS: string | null;
    ENTRY_REMARKS: string | null;
  };
};

export function GateEntryExit() {
  const [searchQuery, setSearchQuery] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<"entry" | "exit" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [studentStatus, setStudentStatus] = useState<StudentStatusResponse | null>(null);

  const loadStudentStatus = async (studentId: string) => {
    const response = await api.get(`/security/student-status/${encodeURIComponent(studentId.trim())}`);
    setStudentStatus(response.data);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await loadStudentStatus(searchQuery);
    } catch (err: any) {
      setStudentStatus(null);
      setError(err.response?.data?.message || "Failed to fetch student status");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkExit = async () => {
    if (!studentStatus) return;

    setSubmitting("exit");
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/security/mark-exit", {
        studentId: studentStatus.student.studentId,
        remarks: remarks.trim() || undefined,
      });
      setSuccess(response.data?.message || "Student exit marked successfully");
      setRemarks("");
      await loadStudentStatus(studentStatus.student.studentId);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to mark exit");
    } finally {
      setSubmitting(null);
    }
  };

  const handleMarkEntry = async () => {
    if (!studentStatus) return;

    setSubmitting("entry");
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/security/mark-entry", {
        studentId: studentStatus.student.studentId,
        remarks: remarks.trim() || undefined,
      });
      setSuccess(response.data?.message || "Student entry marked successfully");
      setRemarks("");
      await loadStudentStatus(studentStatus.student.studentId);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to mark entry");
    } finally {
      setSubmitting(null);
    }
  };

  const clearState = () => {
    setStudentStatus(null);
    setSearchQuery("");
    setRemarks("");
    setError("");
    setSuccess("");
  };

  const student = studentStatus?.student;
  const canExit = studentStatus?.currentGateStatus === "INSIDE" && !!studentStatus.activeLeave;
  const isOutside = studentStatus?.currentGateStatus === "OUTSIDE";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 text-center">Gate Entry / Exit</h2>

      <form onSubmit={handleSearch} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-sm font-medium text-slate-700 mb-2">Enter Student ID</label>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              required
              type="text"
              placeholder="e.g. STU101"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full transition-all text-lg font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-70 flex items-center justify-center shadow-md shadow-teal-200"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : "Verify"}
          </button>
        </div>
      </form>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">{success}</div>}

      <AnimatePresence>
        {studentStatus && student && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
          >
            <div className={`p-6 border-b flex flex-col md:flex-row gap-5 ${isOutside ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"}`}>
              <div className="w-20 h-20 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-2xl font-bold shadow-sm">
                {student.fullName?.charAt(0) || "S"}
              </div>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">{student.fullName || "Student"}</h3>
                    <p className="text-slate-600 font-medium mt-1">{student.studentId}</p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${isOutside ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                    Currently: {isOutside ? "Outside" : "Inside"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-slate-400" />
                    Room {student.roomNo || "N/A"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={15} className="text-slate-400" />
                    {student.phone || "No phone"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={15} className="text-slate-400" />
                    {student.email || "No email"}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {isOutside ? (
                <div className="flex items-center p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                  <div className="bg-emerald-100 p-2 rounded-lg mr-4">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Valid Return</h4>
                    <p className="text-sm">
                      Student is currently outside and can be marked back in.
                    </p>
                  </div>
                </div>
              ) : studentStatus.activeLeave ? (
                <div className="flex items-center p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                  <div className="bg-emerald-100 p-2 rounded-lg mr-4">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Leave Approved</h4>
                    <p className="text-sm font-medium">
                      {studentStatus.activeLeave.LEAVE_TYPE} ({studentStatus.activeLeave.FROM_DATE} to {studentStatus.activeLeave.TO_DATE})
                    </p>
                    <p className="text-xs mt-1">{studentStatus.activeLeave.REASON || "No reason provided"}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                  <div className="bg-red-100 p-2 rounded-lg mr-4">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Exit Denied</h4>
                    <p className="text-sm">No approved leave found for this student on {studentStatus.referenceDate}.</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Remarks</label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={isOutside ? "Optional entry remarks" : "Optional exit remarks"}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                {isOutside ? (
                  <button
                    onClick={handleMarkEntry}
                    disabled={submitting !== null}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-60 shadow-lg shadow-teal-200 text-lg"
                  >
                    <LogIn size={24} />
                    <span>{submitting === "entry" ? "Marking Entry..." : "Mark Entry"}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleMarkExit}
                    disabled={!canExit || submitting !== null}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-200 text-lg"
                  >
                    <LogOut size={24} />
                    <span>{submitting === "exit" ? "Marking Exit..." : "Mark Exit"}</span>
                  </button>
                )}
                <button
                  onClick={clearState}
                  className="px-6 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
