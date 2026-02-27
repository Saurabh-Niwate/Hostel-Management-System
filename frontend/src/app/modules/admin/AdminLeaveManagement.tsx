import React, { useState, useEffect } from "react";
import { Check, X, Search, Clock, CheckCircle, XCircle } from "lucide-react";
import { motion } from "motion/react";

export function AdminLeaveManagement() {
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Dummy Data for GET /api/admin/leaves and GET /api/admin/leaves/student/:studentId
    const [leaves, setLeaves] = useState([
        { id: "L101", studentId: "STU2024001", name: "John Doe", room: "A-101", startDate: "2024-03-20", endDate: "2024-03-25", reason: "Family Function", status: "Pending" },
        { id: "L102", studentId: "STU2024045", name: "Sarah Smith", room: "B-204", startDate: "2024-03-18", endDate: "2024-03-19", reason: "Medical Appointment", status: "Approved" },
        { id: "L103", studentId: "STU2024089", name: "Mike Johnson", room: "C-105", startDate: "2024-03-22", endDate: "2024-03-28", reason: "Sister's Wedding", status: "Pending" },
        { id: "L104", studentId: "STU2024112", name: "Emma Davis", room: "A-302", startDate: "2024-03-10", endDate: "2024-03-12", reason: "Going Home", status: "Rejected" },
    ]);

    useEffect(() => {
        setTimeout(() => setLoading(false), 600);
    }, []);

    // Simulated PUT /api/admin/leave/:leaveId/approve
    const handleApprove = (id: string) => {
        setLeaves(leaves.map(leave => leave.id === id ? { ...leave, status: "Approved" } : leave));
    };

    // Simulated PUT /api/admin/leave/:leaveId/reject
    const handleReject = (id: string) => {
        setLeaves(leaves.map(leave => leave.id === id ? { ...leave, status: "Rejected" } : leave));
    };

    const filteredLeaves = leaves.filter(leave =>
        leave.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.studentId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
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

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search student name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full md:w-80 transition-all"
                    />
                </div>
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
                            {filteredLeaves.map((leave, index) => (
                                <motion.tr
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={leave.id}
                                    className="hover:bg-slate-50/50 transition-colors"
                                >
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800">{leave.name}</div>
                                        <div className="text-xs text-slate-500">{leave.studentId} • Room {leave.room}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm font-medium text-slate-700">{new Date(leave.startDate).toLocaleDateString()} to</div>
                                        <div className="text-sm font-medium text-slate-700">{new Date(leave.endDate).toLocaleDateString()}</div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600 max-w-xs truncate">
                                        {leave.reason}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                                                leave.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-amber-100 text-amber-800'
                                            }`}>
                                            {leave.status === 'Pending' && <Clock size={12} className="mr-1" />}
                                            {leave.status === 'Approved' && <CheckCircle size={12} className="mr-1" />}
                                            {leave.status === 'Rejected' && <XCircle size={12} className="mr-1" />}
                                            {leave.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {leave.status === 'Pending' ? (
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleReject(leave.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
                                                    title="Reject"
                                                >
                                                    <X size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(leave.id)}
                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 hover:border-emerald-300"
                                                    title="Approve"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-sm italic">Processed</span>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                            {filteredLeaves.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        No leave applications found matching your search.
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
