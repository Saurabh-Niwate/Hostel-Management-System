import React, { useEffect, useState } from "react";
import { LogIn, LogOut, Clock } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../lib/api";

type SecurityLog = {
  LOG_ID: number;
  STUDENT_ID: string;
  FULL_NAME: string | null;
  ROOM_NO: string | null;
  EXIT_TIME: string | null;
  ENTRY_TIME: string | null;
  STATUS: "IN" | "OUT";
  EXIT_REMARKS: string | null;
  ENTRY_REMARKS: string | null;
  LEAVE_ID: number | null;
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

type TodayLogsProps = {
  refreshKey?: number;
};

export function TodayLogs({ refreshKey = 0 }: TodayLogsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<SecurityLog[]>([]);

  const loadLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/security/today-logs");
      setLogs(response.data?.logs || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load today's logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Student</th>
                <th className="p-4 font-medium">Room</th>
                <th className="p-4 font-medium">Exit Time</th>
                <th className="p-4 font-medium">Entry Time</th>
                <th className="p-4 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">No logs found for today.</td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    key={log.LOG_ID}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${log.STATUS === "IN" ? "bg-slate-100 text-slate-800" : "bg-orange-100 text-orange-800"}`}>
                        {log.STATUS === "IN" ? <LogIn size={12} className="mr-1" /> : <LogOut size={12} className="mr-1" />}
                        {log.STATUS}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{log.FULL_NAME || "Student"}</div>
                      <div className="text-xs text-slate-500">{log.STUDENT_ID}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{log.ROOM_NO || "-"}</td>
                    <td className="p-4">
                      <div className="flex items-center text-sm font-medium text-slate-700">
                        <Clock size={14} className="mr-2 text-slate-400" />
                        {formatDateTime(log.EXIT_TIME)}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{formatDateTime(log.ENTRY_TIME)}</td>
                    <td className="p-4 text-sm text-slate-600">
                      {log.STATUS === "OUT" ? log.EXIT_REMARKS || "-" : log.ENTRY_REMARKS || "-"}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
