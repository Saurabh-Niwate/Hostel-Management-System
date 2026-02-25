
import React, { useState } from "react";
import { Plus, Calendar, Clock, AlertCircle, X, CheckCircle, Trash2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import * as Tooltip from '@radix-ui/react-tooltip';

// Using date-fns for simpler simulation
// In real app, consider using react-day-picker

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

const DUMMY_LEAVES: Leave[] = [
    {
        id: "1",
        type: "Sick Leave",
        startDate: "2024-03-10",
        endDate: "2024-03-12",
        reason: "Viral fever and high temperature",
        status: "Approved",
        appliedOn: "2024-03-09"
    },
    {
        id: "2",
        type: "Home Visit",
        startDate: "2024-04-15",
        endDate: "2024-04-20",
        reason: "Attending sister's wedding",
        status: "Pending",
        appliedOn: "2024-04-01"
    }
];

export function LeaveManagement() {
    const [activeTab, setActiveTab] = useState<"list" | "apply">("list");
    const [leaves, setLeaves] = useState<Leave[]>(DUMMY_LEAVES);
    const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        type: "Home Visit",
        startDate: "",
        endDate: "",
        reason: ""
    });

    const handleApply = (e: React.FormEvent) => {
        e.preventDefault();
        const newLeave: Leave = {
            id: Date.now().toString(),
            ...formData,
            status: "Pending",
            appliedOn: new Date().toISOString().split('T')[0]
        };
        setLeaves([newLeave, ...leaves]);
        setActiveTab("list");
        setFormData({ type: "Home Visit", startDate: "", endDate: "", reason: "" });
    };

    const handleCancelLeave = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setLeaves(leaves.filter(l => l.id !== id));
        if (selectedLeave?.id === id) setSelectedLeave(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Leave Management</h2>
                    <p className="text-slate-500">Apply for leaves and track status</p>
                </div>
                {activeTab === "list" && (
                    <button
                        onClick={() => setActiveTab("apply")}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all font-medium"
                    >
                        <Plus size={18} className="mr-2" />
                        Apply New Leave
                    </button>
                )}
                {activeTab === "apply" && (
                    <button
                        onClick={() => setActiveTab("list")}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                    >
                        Cancel
                    </button>
                )}
            </div>

            {activeTab === "list" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        {leaves.map((leave) => (
                            <motion.div
                                layoutId={leave.id}
                                key={leave.id}
                                onClick={() => setSelectedLeave(leave)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedLeave?.id === leave.id
                                        ? "bg-blue-50 border-blue-200 shadow-md ring-1 ring-blue-500"
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
                                        {format(new Date(leave.startDate), "MMM d, yyyy")} - {format(new Date(leave.endDate), "MMM d, yyyy")}
                                    </span>
                                    <span className="flex items-center">
                                        <Clock size={14} className="mr-1" />
                                        Applied: {format(new Date(leave.appliedOn), "MMM d")}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Details Side Panel */}
                    <div className="lg:col-span-1">
                        <AnimatePresence mode="wait">
                            {selectedLeave ? (
                                <motion.div
                                    key={selectedLeave.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-6"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <h3 className="text-xl font-bold text-slate-800">Leave Details</h3>
                                        <button onClick={() => setSelectedLeave(null)} className="text-slate-400 hover:text-slate-600">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</label>
                                            <p className="text-slate-800 font-medium">{selectedLeave.type}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Duration</label>
                                            <p className="text-slate-800 font-medium">
                                                {format(new Date(selectedLeave.startDate), "MMM d, yyyy")} - {format(new Date(selectedLeave.endDate), "MMM d, yyyy")}
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
                                            <div className="mt-1"><StatusBadge status={selectedLeave.status} /></div>
                                        </div>
                                    </div>

                                    {selectedLeave.status === "Pending" && (
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
                                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                            >
                                Submit Application
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
        "Pending": "bg-amber-50 text-amber-600 border-amber-200",
        "Approved": "bg-emerald-50 text-emerald-600 border-emerald-200",
        "Rejected": "bg-red-50 text-red-600 border-red-200"
    };

    const icons = {
        "Pending": <Clock size={12} className="mr-1" />,
        "Approved": <CheckCircle size={12} className="mr-1" />,
        "Rejected": <AlertCircle size={12} className="mr-1" />
    };

    return (
        <span className={`flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${colors[status]}`}>
            {icons[status]}
            {status}
        </span>
    );
}

// Temporary FileText icon stub since we used it in empty state
function FileTextStub({ size, className }: any) {
    return <FileText size={size} className={className} />
}
