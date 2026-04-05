import React, { useState } from "react";
import { User, LogOut, FileText, LayoutDashboard, CalendarCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";

// Components
import { AdminReportsOverview } from "./AdminReportsOverview";
import { AdminLeaveManagement } from "./AdminLeaveManagement";
import { AdminAttendanceSummary } from "./AdminAttendanceSummary";
import { AdminStudentView } from "./AdminStudentView";
import { StaffProfileSettings } from "../../components/StaffProfileSettings";

type Tab = "dashboard" | "leaves" | "attendance" | "studentView" | "profile";

export function AdminDashboard() {
    const theme = {
        color: "#1d4ed8",
        activeColor: "#2563eb",
        bg: "bg-blue-50"
    };
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
            case "studentView":
                return <AdminStudentView />;
            case "profile":
                return (
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
                        </div>
                        <StaffProfileSettings />
                    </div>
                );
            default:
                return <div>Select a tab</div>;
        }
    };

    return (
        <div className={`min-h-screen ${theme.bg} flex`}>
            {/* Sidebar */}
            <motion.aside
                initial={{ width: 280 }}
                animate={{ width: isSidebarOpen ? 280 : 80 }}
                className="text-white fixed h-full z-20 flex flex-col transition-all duration-300"
                style={{ backgroundColor: theme.color, borderRight: "1px solid rgba(255,255,255,0.18)" }}
            >
                <div className="p-6 flex items-center justify-between border-b border-white/20">
                    {isSidebarOpen ? (
                        <h1 className="text-xl font-bold tracking-wide truncate">Admin Portal</h1>
                    ) : (
                        <div className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center bg-white/15">
                            <span className="font-bold text-sm">A</span>
                        </div>
                    )}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg md:hidden">
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
                        activeColor={theme.activeColor}
                    />
                    <SidebarItem
                        icon={<FileText size={20} />}
                        label="Leave Management"
                        active={activeTab === "leaves"}
                        onClick={() => setActiveTab("leaves")}
                        isOpen={isSidebarOpen}
                        activeColor={theme.activeColor}
                    />
                    <SidebarItem
                        icon={<CalendarCheck size={20} />}
                        label="Attendance"
                        active={activeTab === "attendance"}
                        onClick={() => setActiveTab("attendance")}
                        isOpen={isSidebarOpen}
                        activeColor={theme.activeColor}
                    />
                    <SidebarItem
                        icon={<User size={20} />}
                        label="Student View"
                        active={activeTab === "studentView"}
                        onClick={() => setActiveTab("studentView")}
                        isOpen={isSidebarOpen}
                        activeColor={theme.activeColor}
                    />
                    <SidebarItem
                        icon={<User size={20} />}
                        label="Profile"
                        active={activeTab === "profile"}
                        onClick={() => setActiveTab("profile")}
                        isOpen={isSidebarOpen}
                        activeColor={theme.activeColor}
                    />
                </nav>

                <div className="p-4 border-t border-white/20">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full p-3 bg-white text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shadow-sm ${!isSidebarOpen && 'justify-center'}`}
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

function SidebarItem({ icon, label, active, onClick, isOpen, activeColor }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center w-full p-3 rounded-xl transition-all duration-200 ${active
                    ? "text-white shadow-lg"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                } ${!isOpen && 'justify-center'}`}
            style={active ? { backgroundColor: activeColor } : undefined}
        >
            {icon}
            {isOpen && <span className="ml-3 font-medium">{label}</span>}
        </button>
    );
}
