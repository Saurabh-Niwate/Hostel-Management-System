import React, { useState, useEffect } from "react";
import { LogIn, LogOut, Clock, Filter } from "lucide-react";
import { motion } from "motion/react";

export function TodayLogs() {
    const [loading, setLoading] = useState(true);

    // Dummy Data for GET /api/security/today-logs
    const logs = [
        { id: "LOG001", studentId: "STU2024102", name: "Sarah Smith", type: "ENTRY", time: "10:45 AM", date: "Today", by: "Guard Ramesh" },
        { id: "LOG002", studentId: "STU2024101", name: "John Doe", type: "EXIT", time: "09:30 AM", date: "Today", by: "Guard Suresh", reason: "Family Function" },
        { id: "LOG003", studentId: "STU2024045", name: "Alex Johnson", type: "ENTRY", time: "08:15 AM", date: "Today", by: "Guard Ramesh" },
        { id: "LOG004", studentId: "STU2024112", name: "Emma Davis", type: "EXIT", time: "07:00 AM", date: "Today", by: "Guard Suresh", reason: "Going Home" },
    ];

    useEffect(() => {
        setTimeout(() => setLoading(false), 500);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Today's Logs</h2>
                <div className="flex space-x-2">
                    <button className="flex items-center px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors line-clamp-1">
                        <Filter size={16} className="mr-2" /> Filter
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                                <th className="p-4 font-medium">Type</th>
                                <th className="p-4 font-medium">Time</th>
                                <th className="p-4 font-medium">Student</th>
                                <th className="p-4 font-medium">Details</th>
                                <th className="p-4 font-medium">Logged By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map((log, index) => (
                                <motion.tr
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={log.id}
                                    className="hover:bg-slate-50/50 transition-colors"
                                >
                                    <td className="p-4">
                                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${log.type === 'ENTRY' ? 'bg-teal-100 text-teal-800' : 'bg-orange-100 text-orange-800'
                                            }`}>
                                            {log.type === 'ENTRY' ? <LogIn size={12} className="mr-1" /> : <LogOut size={12} className="mr-1" />}
                                            {log.type}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center text-sm font-medium text-slate-700">
                                            <Clock size={14} className="mr-2 text-slate-400" />
                                            {log.time}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800">{log.name}</div>
                                        <div className="text-xs text-slate-500">{log.studentId}</div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {log.reason ? <span className="italic">"{log.reason}"</span> : "-"}
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">
                                        {log.by}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
