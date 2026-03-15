import React, { useEffect, useMemo, useState } from "react";
import { MapPin, Search, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../lib/api";

type OutsideStudent = {
  LOG_ID: number;
  STUDENT_ID: string;
  FULL_NAME: string | null;
  ROOM_NO: string | null;
  EXIT_TIME: string | null;
  EXIT_REMARKS: string | null;
  LEAVE_ID: number | null;
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export function StudentsOutside() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [outsideList, setOutsideList] = useState<OutsideStudent[]>([]);

  const loadStudentsOutside = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/security/students-outside");
      setOutsideList(response.data?.studentsOutside || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load students outside");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentsOutside();
  }, []);

  const filteredList = useMemo(
    () =>
      outsideList.filter((student) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return (
          (student.FULL_NAME || "").toLowerCase().includes(query) ||
          (student.STUDENT_ID || "").toLowerCase().includes(query) ||
          (student.ROOM_NO || "").toLowerCase().includes(query)
        );
      }),
    [outsideList, searchQuery]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search name, ID, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full md:w-80 transition-all"
            />
          </div>
          <button
            onClick={loadStudentsOutside}
            className="flex items-center px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredList.map((student, index) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            key={student.LOG_ID}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full"
          >
            <div className="absolute top-0 right-0 p-3 bg-amber-50 text-amber-700 rounded-bl-xl font-bold text-xs uppercase tracking-wider">
              Outside
            </div>

            <div className="flex items-start space-x-4 mb-4">
              <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm flex items-center justify-center font-bold text-teal-600 bg-teal-50">
                {(student.FULL_NAME || "S").charAt(0)}
              </div>
              <div className="mt-1">
                <h3 className="font-bold text-slate-800 text-lg leading-tight">{student.FULL_NAME || "Student"}</h3>
                <div className="text-xs font-semibold text-slate-500 mt-1 flex items-center">
                  <span className="bg-slate-100 px-2 py-0.5 rounded">{student.STUDENT_ID}</span>
                  <span className="ml-2 flex items-center"><MapPin size={10} className="mr-0.5" /> {student.ROOM_NO || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-auto text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Out Since:</span>
                <span className="font-medium text-slate-800 text-right">{formatDateTime(student.EXIT_TIME)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Leave ID:</span>
                <span className="font-medium text-slate-800">{student.LEAVE_ID ?? "-"}</span>
              </div>
              <div className="mt-1 pt-2 border-t border-slate-200/60">
                <p className="text-slate-600 italic text-xs">{student.EXIT_REMARKS || "No exit remarks"}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredList.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
          <p className="text-slate-500 font-medium">No students found outside.</p>
        </div>
      )}
    </div>
  );
}
