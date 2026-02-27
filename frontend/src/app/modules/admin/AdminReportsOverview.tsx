import React, { useState, useEffect } from "react";
import { Users, Home, AlertCircle, Calendar, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

export function AdminReportsOverview() {
    const [loading, setLoading] = useState(true);

    // Dummy Data for GET /api/admin/reports/overview
    const reportData = {
        totalStudents: 1250,
        occupancyRate: 92,
        totalRooms: 500,
        availableRooms: 40,
        pendingMaintenance: 15,
        leavesToday: 23,
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
            <h2 className="text-2xl font-bold text-slate-800">Reports Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-4 bg-indigo-100 text-indigo-600 rounded-xl">
                        <Users size={28} />
                    </div>
                    <div>
                        <h3 className="text-slate-500 text-sm font-medium">Total Students</h3>
                        <p className="text-2xl font-bold text-slate-800">{reportData.totalStudents}</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-4 bg-emerald-100 text-emerald-600 rounded-xl">
                        <Home size={28} />
                    </div>
                    <div>
                        <h3 className="text-slate-500 text-sm font-medium">Occupancy Rate</h3>
                        <p className="text-2xl font-bold text-slate-800">{reportData.occupancyRate}%</p>
                        <p className="text-xs text-slate-400 mt-1">{reportData.availableRooms} rooms available</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-4 bg-amber-100 text-amber-600 rounded-xl">
                        <AlertCircle size={28} />
                    </div>
                    <div>
                        <h3 className="text-slate-500 text-sm font-medium">Pending Maintenance</h3>
                        <p className="text-2xl font-bold text-slate-800">{reportData.pendingMaintenance}</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-4 bg-blue-100 text-blue-600 rounded-xl">
                        <Calendar size={28} />
                    </div>
                    <div>
                        <h3 className="text-slate-500 text-sm font-medium">Leaves Today</h3>
                        <p className="text-2xl font-bold text-slate-800">{reportData.leavesToday}</p>
                    </div>
                </motion.div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <TrendingUp className="mr-2 text-indigo-500" size={20} />
                    Quick Insights
                </h3>
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-slate-700 font-medium">Occupancy is up by 2% compared to last semester.</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-amber-800 font-medium">Maintenance requests in Block B are higher than average.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
