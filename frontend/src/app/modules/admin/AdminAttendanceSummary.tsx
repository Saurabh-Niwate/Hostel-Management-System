import React, { useState, useEffect } from "react";
import { Users, AlertTriangle, UserCheck, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

export function AdminAttendanceSummary() {
    const [loading, setLoading] = useState(true);

    // Dummy Data for GET /api/admin/attendance/summary
    const summaryData = {
        overallAttendance: 88.5,
        totalStudents: 1250,
        presentToday: 1105,
        absentToday: 145,
        lowAttendanceCount: 42, // Students below 75%
        lowAttendanceList: [
            { id: "STU2024010", name: "David Miller", room: "A-201", percentage: 65 },
            { id: "STU2024022", name: "Paul Walker", room: "B-105", percentage: 58 },
            { id: "STU2024105", name: "Chris Evans", room: "C-302", percentage: 71 },
        ]
    };

    useEffect(() => {
        setTimeout(() => setLoading(false), 500);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Attendance Summary</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                    <TrendingUp size={32} className="text-indigo-500 mb-2" />
                    <h3 className="text-slate-500 text-sm font-medium">Overall Attendance</h3>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{summaryData.overallAttendance}%</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                    <UserCheck size={32} className="text-emerald-500 mb-2" />
                    <h3 className="text-slate-500 text-sm font-medium">Present Today</h3>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">{summaryData.presentToday}</p>
                    <span className="text-xs text-slate-400 mt-1">out of {summaryData.totalStudents}</span>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                    <Users size={32} className="text-slate-400 mb-2" />
                    <h3 className="text-slate-500 text-sm font-medium">Absent Today</h3>
                    <p className="text-3xl font-bold text-slate-700 mt-2">{summaryData.absentToday}</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 bg-red-50 flex flex-col items-center justify-center">
                    <AlertTriangle size={32} className="text-red-500 mb-2" />
                    <h3 className="text-red-700 text-sm font-medium">Below Target (75%)</h3>
                    <p className="text-3xl font-bold text-red-600 mt-2">{summaryData.lowAttendanceCount}</p>
                    <span className="text-xs text-red-400 mt-1">Students</span>
                </motion.div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">Critical Attendance (Below 75%)</h3>
                    <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">View All</button>
                </div>
                <div className="divide-y divide-slate-100">
                    {summaryData.lowAttendanceList.map((student, index) => (
                        <div key={student.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div>
                                <h4 className="font-bold text-slate-800">{student.name}</h4>
                                <p className="text-sm text-slate-500">{student.id} • Room {student.room}</p>
                            </div>
                            <div className="flex items-center">
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${student.percentage < 60 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    {student.percentage}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
