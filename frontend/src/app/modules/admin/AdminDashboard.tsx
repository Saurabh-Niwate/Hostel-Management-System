import React, { useEffect, useState } from "react";
import { User, LogOut, FileText, LayoutDashboard, CalendarCheck, Menu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { clearAuthSession, getStoredIdentifier, getStoredRole, getStoredToken } from "../../lib/authStorage";

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
    const [isSidebarOpen, setIsSidebarOpen] = useState(
        typeof window !== "undefined" ? window.innerWidth >= 768 : true
    );
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = getStoredToken();
        const role = getStoredRole();
        if (!token || role !== "Admin") {
            navigate("/");
        }
        else {
            setIsAuthChecking(false);
        }
    }, [navigate]);

    const handleLogout = () => {
        api.post("/auth/logout").catch(() => undefined).finally(() => {
            clearAuthSession();
            navigate("/");
        });
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

    if (isAuthChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-50">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    <p className="text-sm font-medium text-blue-700">Verifying access...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${theme.bg} flex flex-col md:flex-row`}>
            {/* Mobile Top Navbar */}
            <header className="md:hidden flex h-16 items-center justify-between px-6 text-white z-20 shadow-md w-full shrink-0" style={{ backgroundColor: theme.color }}>
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-lg">
                        <Menu className="h-6 w-6" />
                    </button>
                    <h1 className="text-lg font-bold tracking-wide">Admin Portal</h1>
                </div>
                <div className="text-xs text-white/80 font-medium">{getStoredIdentifier() || "ADMIN"}</div>
            </header>

            {/* Mobile Sidebar Backdrop Overlay */}
            <AnimatePresence>
                {isSidebarOpen && typeof window !== "undefined" && window.innerWidth < 768 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: isSidebarOpen ? 280 : 80,
                    x: typeof window !== "undefined" && window.innerWidth < 768 ? (isSidebarOpen ? 0 : -280) : 0
                }}
                transition={{ type: "tween", duration: 0.25 }}
                className="text-white fixed md:sticky top-0 left-0 h-full md:h-screen z-30 flex flex-col shrink-0"
                style={{
                    backgroundColor: theme.color,
                    borderRight: "1px solid rgba(255,255,255,0.18)",
                    width: isSidebarOpen ? 280 : 80
                }}
            >
                <div className="p-6 flex items-center justify-between border-b border-white/20 h-16 md:h-auto">
                    {isSidebarOpen ? (
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl font-bold tracking-wide truncate">Admin Portal</h1>
                            <p className="text-xs text-white/80 truncate">{getStoredIdentifier() || "ADMIN"}</p>
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center bg-white/15">
                            <span className="font-bold text-sm">A</span>
                        </div>
                    )}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg md:inline-block hidden">
                        <Menu className="h-5 w-5" />
                    </button>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg md:hidden">
                        <Menu className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto">
                    <SidebarItem
                        icon={<LayoutDashboard size={20} />}
                        label="Overview"
                        active={activeTab === "dashboard"}
                        onClick={() => { setActiveTab("dashboard"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                        isOpen={isSidebarOpen}
                        activeColor={theme.activeColor}
                    />
                    <SidebarItem
                        icon={<FileText size={20} />}
                        label="Leave Management"
                        active={activeTab === "leaves"}
                        onClick={() => { setActiveTab("leaves"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                        isOpen={isSidebarOpen}
                        activeColor={theme.activeColor}
                    />
                    <SidebarItem
                        icon={<CalendarCheck size={20} />}
                        label="Attendance"
                        active={activeTab === "attendance"}
                        onClick={() => { setActiveTab("attendance"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                        isOpen={isSidebarOpen}
                        activeColor={theme.activeColor}
                    />
                    <SidebarItem
                        icon={<User size={20} />}
                        label="Student View"
                        active={activeTab === "studentView"}
                        onClick={() => { setActiveTab("studentView"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                        isOpen={isSidebarOpen}
                        activeColor={theme.activeColor}
                    />
                    <SidebarItem
                        icon={<User size={20} />}
                        label="Profile"
                        active={activeTab === "profile"}
                        onClick={() => { setActiveTab("profile"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
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
            <main className="flex-1 p-4 md:p-8 transition-all duration-300 min-h-[101vh] overflow-x-hidden">
                <div className="max-w-6xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="min-h-[60vh]"
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
            className={`w-full flex items-center p-3 rounded-xl transition-colors font-medium ${
                active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/5"
            } ${!isOpen && "justify-center"}`}
            style={active ? { backgroundColor: activeColor } : undefined}
        >
            {icon}
            {isOpen && <span className="ml-3">{label}</span>}
        </button>
    );
}