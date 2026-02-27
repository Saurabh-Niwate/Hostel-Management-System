import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Calendar, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

export function AttendanceView() {
    const [loading, setLoading] = useState(true);

    // Dummy Data for GET /api/student/attendance
    const attendanceData = {
        totalDays: 120,
        presentDays: 105,
        absentDays: 15,
        percentage: 87.5,
        recentRecords: [
            { date: "2024-03-15", status: "Present" },
            { date: "2024-03-14", status: "Present" },
            { date: "2024-03-13", status: "Absent" },
            { date: "2024-03-12", status: "Present" },
            { date: "2024-03-11", status: "Present" },
        ]
    };

    useEffect(() => {
        setTimeout(() => setLoading(false), 600);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Attendance Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                    <TrendingUp className="text-blue-500 mb-2" size={32} />
                    <h3 className="text-slate-500 text-sm font-medium">Overall Percentage</h3>
                    <p className="text-3xl font-bold text-slate-800 mt-2">{attendanceData.percentage}%</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                    <Calendar className="text-slate-500 mb-2" size={32} />
                    <h3 className="text-slate-500 text-sm font-medium">Total Days</h3>
                    <p className="text-3xl font-bold text-slate-800 mt-2">{attendanceData.totalDays}</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                    <CheckCircle2 className="text-emerald-500 mb-2" size={32} />
                    <h3 className="text-slate-500 text-sm font-medium">Present Days</h3>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">{attendanceData.presentDays}</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                    <XCircle className="text-red-500 mb-2" size={32} />
                    <h3 className="text-slate-500 text-sm font-medium">Absent Days</h3>
                    <p className="text-3xl font-bold text-red-600 mt-2">{attendanceData.absentDays}</p>
                </motion.div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Recent Attendance</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {attendanceData.recentRecords.map((record, index) => (
                        <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-slate-100 rounded-lg">
                                    <Calendar size={18} className="text-slate-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {record.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
