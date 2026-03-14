import React, { useState } from "react";
import { Search, UserCheck, ShieldAlert, LogIn, LogOut, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function GateEntryExit() {
    const [searchQuery, setSearchQuery] = useState("");
    const [scannedStudent, setScannedStudent] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Simulated GET /api/security/student-status/:studentId
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            // Dummy logic to return different states based on ID
            if (searchQuery.includes("101")) {
                setScannedStudent({
                    id: searchQuery,
                    name: "John Doe",
                    room: "A-101",
                    status: "Inside",
                    hasApprovedLeave: true,
                    leaveDetails: "Family Function (Approved until 25th Mar)",
                    photo: "https://ui-avatars.com/api/?name=John+Doe&background=e0e7ff&color=4338ca"
                });
            } else if (searchQuery.includes("102")) {
                setScannedStudent({
                    id: searchQuery,
                    name: "Sarah Smith",
                    room: "B-204",
                    status: "Outside",
                    hasApprovedLeave: true,
                    leaveDetails: "Medical Appointment",
                    photo: "https://ui-avatars.com/api/?name=Sarah+Smith&background=fce7f3&color=be185d"
                });
            } else {
                setScannedStudent({
                    id: searchQuery,
                    name: "Mike Johnson",
                    room: "C-105",
                    status: "Inside",
                    hasApprovedLeave: false,
                    leaveDetails: null,
                    photo: "https://ui-avatars.com/api/?name=Mike+Johnson&background=dcfce7&color=15803d"
                });
            }
            setLoading(false);
        }, 600);
    };

    // Simulated POST /api/security/mark-exit
    const handleMarkExit = () => {
        alert(`Marked Exit for ${scannedStudent.name}`);
        setScannedStudent({ ...scannedStudent, status: "Outside" });
    };

    // Simulated POST /api/security/mark-entry
    const handleMarkEntry = () => {
        alert(`Marked Entry for ${scannedStudent.name}`);
        setScannedStudent({ ...scannedStudent, status: "Inside" });
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 text-center">Gate Entry / Exit</h2>

            <form onSubmit={handleSearch} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">Scan ID Card or Enter Student ID</label>
                <div className="flex space-x-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            required
                            type="text"
                            placeholder="e.g. STU2024101"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full transition-all text-lg font-medium"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !searchQuery}
                        className="px-6 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-70 flex items-center shadow-md shadow-teal-200"
                    >
                        {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : "Verify"}
                    </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Try ending with '101' for allowed exit, '102' for entry, or anything else for denied exit.</p>
            </form>

            <AnimatePresence>
                {scannedStudent && !loading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
                    >
                        <div className={`p-6 border-b flex items-start space-x-6 ${scannedStudent.status === 'Outside' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'
                            }`}>
                            <img src={scannedStudent.photo} alt="Student" className="w-24 h-24 rounded-full border-4 border-white shadow-md" />
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800">{scannedStudent.name}</h3>
                                        <p className="text-slate-600 font-medium mt-1">{scannedStudent.id} • Room {scannedStudent.room}</p>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${scannedStudent.status === 'Inside' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                        Currently: {scannedStudent.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Validation Status */}
                            <div className="mb-6">
                                {scannedStudent.status === 'Outside' ? (
                                    <div className="flex items-center p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                                        <div className="bg-emerald-100 p-2 rounded-lg mr-4">
                                            <UserCheck size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">Valid Return</h4>
                                            <p className="text-sm">Student is returning to the hostel.</p>
                                        </div>
                                    </div>
                                ) : scannedStudent.hasApprovedLeave ? (
                                    <div className="flex items-center p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                                        <div className="bg-emerald-100 p-2 rounded-lg mr-4">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">Leave Approved</h4>
                                            <p className="text-sm font-medium">{scannedStudent.leaveDetails}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                                        <div className="bg-red-100 p-2 rounded-lg mr-4">
                                            <ShieldAlert size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">Exit Denied</h4>
                                            <p className="text-sm">No valid leave application found for this student.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-4">
                                {scannedStudent.status === 'Outside' ? (
                                    <button
                                        onClick={handleMarkEntry}
                                        className="flex-1 flex items-center justify-center space-x-2 py-4 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200 text-lg"
                                    >
                                        <LogIn size={24} />
                                        <span>Mark ENTRY</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleMarkExit}
                                        disabled={!scannedStudent.hasApprovedLeave}
                                        className="flex-1 flex items-center justify-center space-x-2 py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-200 text-lg"
                                    >
                                        <LogOut size={24} />
                                        <span>Mark EXIT</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setScannedStudent(null)}
                                    className="px-6 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
