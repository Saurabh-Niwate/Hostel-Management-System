import React, { useState } from "react";
import { User, LogOut, FileText, LayoutDashboard, CalendarCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";

// Components
import { AdminReportsOverview } from "./AdminReportsOverview";
import { AdminLeaveManagement } from "./AdminLeaveManagement";
import { AdminAttendanceSummary } from "./AdminAttendanceSummary";

type Tab = "dashboard" | "leaves" | "attendance";

export function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>("dashboard");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userIdentifier");
        navigate("/");
    };

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard":
                return <AdminReportsOverview />;
            case "leaves":
                return <AdminLeaveManagement />;
            case "attendance":
                return <AdminAttendanceSummary />;
            default:
                return <div>Select a tab</div>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <motion.aside
                initial={{ width: 280 }}
                animate={{ width: isSidebarOpen ? 280 : 80 }}
                className="bg-indigo-900 border-r border-indigo-800 text-white fixed h-full z-20 flex flex-col transition-all duration-300"
            >
                <div className="p-6 flex items-center justify-between border-b border-indigo-800/50">
                    {isSidebarOpen ? (
                        <h1 className="text-xl font-bold tracking-wide truncate">Admin Portal</h1>
                    ) : (
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg mx-auto flex items-center justify-center">
                            <span className="font-bold text-sm">A</span>
                        </div>
                    )}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-indigo-800 rounded-lg md:hidden">
                        {/* Mobile toggle icon if needed */}
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-6">
                    <SidebarItem
                        icon={<LayoutDashboard size={20} />}
                        label="Overview"
                        active={activeTab === "dashboard"}
                        onClick={() => setActiveTab("dashboard")}
                        isOpen={isSidebarOpen}
                    />
                    <SidebarItem
                        icon={<FileText size={20} />}
                        label="Leave Management"
                        active={activeTab === "leaves"}
                        onClick={() => setActiveTab("leaves")}
                        isOpen={isSidebarOpen}
                    />
                    <SidebarItem
                        icon={<CalendarCheck size={20} />}
                        label="Attendance"
                        active={activeTab === "attendance"}
                        onClick={() => setActiveTab("attendance")}
                        isOpen={isSidebarOpen}
                    />
                </nav>

                <div className="p-4 border-t border-indigo-800/50">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full p-3 text-red-300 hover:bg-red-900/30 rounded-xl transition-colors ${!isSidebarOpen && 'justify-center'}`}
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="ml-3 font-medium">Logout</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className={`flex-1 p-8 transition-all duration-300 ${isSidebarOpen ? 'ml-[280px]' : 'ml-[80px]'}`}>
                <div className="max-w-6xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

function SidebarItem({ icon, label, active, onClick, isOpen }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center w-full p-3 rounded-xl transition-all duration-200 ${active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50"
                    : "text-indigo-200 hover:bg-indigo-800 hover:text-white"
                } ${!isOpen && 'justify-center'}`}
        >
            {icon}
            {isOpen && <span className="ml-3 font-medium">{label}</span>}
        </button>
    );
}
