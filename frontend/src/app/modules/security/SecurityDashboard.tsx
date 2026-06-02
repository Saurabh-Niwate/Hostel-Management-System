import React, { useState } from "react";
import { LogOut, DoorOpen, Clock, Users, ShieldCheck, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";

// Components
import { GateEntryExit } from "./GateEntryExit";
import { TodayLogs } from "./TodayLogs";
import { StudentsOutside } from "./StudentsOutside";
import { StaffProfileSettings } from "../../components/StaffProfileSettings";
import { api } from "../../lib/api";
import { clearAuthSession, getStoredIdentifier, getStoredRole, getStoredToken } from "../../lib/authStorage";

type Tab = "gate" | "logs" | "outside" | "profile";

export function SecurityDashboard() {
    const theme = {
        color: "#334155",
        activeColor: "#475569",
        bg: "bg-slate-50",
        text: "text-white",
        muted: "text-white/80"
    };
    const [activeTab, setActiveTab] = useState<Tab>("gate");
    const [isSidebarOpen, setIsSidebarOpen] = useState(
        typeof window !== "undefined" ? window.innerWidth >= 768 : true
    );
    const [logsRefreshKey, setLogsRefreshKey] = useState(0);
    const navigate = useNavigate();

    React.useEffect(() => {
        const token = getStoredToken();
        const role = getStoredRole();
        if (!token || role !== "Security") {
            navigate("/");
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
            case "gate":
                return <GateEntryExit />;
            case "logs":
                return <TodayLogs refreshKey={logsRefreshKey} />;
            case "outside":
                return <StudentsOutside />;
            case "profile":
                return <StaffProfileSettings />;
            default:
                return <div>Select a tab</div>;
        }
    };

    const headerAction =
        activeTab === "logs" ? (
            <button
                onClick={() => setLogsRefreshKey((prev) => prev + 1)}
                className="flex items-center px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
                <RefreshCw size={16} className="mr-2" />
                Refresh
            </button>
        ) : null;

    return (
        <div className={`min-h-screen ${theme.bg} flex flex-col md:flex-row`}>
            {/* Mobile Top Navbar */}
            <header className="md:hidden flex h-16 items-center justify-between px-6 text-white z-20 shadow-md w-full shrink-0" style={{ backgroundColor: theme.color }}>
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-lg">
                        <DoorOpen className="h-6 w-6" />
                    </button>
                    <h1 className="text-lg font-bold tracking-wide">Security Portal</h1>
                </div>
                <div className="text-xs text-white/80 font-medium">{getStoredIdentifier() || "SECURITY"}</div>
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
                            <h1 className="text-xl font-bold tracking-wide truncate">Security Portal</h1>
                            <p className="text-xs text-white/80 truncate">{getStoredIdentifier() || "SECURITY"}</p>
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center bg-white/15">
                            <ShieldCheck className="h-5 w-5 text-white" />
                        </div>
                    )}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg md:inline-block hidden">
                        <DoorOpen className="h-5 w-5" />
                    </button>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg md:hidden">
                        <DoorOpen className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto">
                    <SidebarItem
                        icon={<DoorOpen size={20} className="shrink-0" />}
                        label="Gate Entry / Exit"
                        active={activeTab === "gate"}
                        onClick={() => { setActiveTab("gate"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                        isOpen={isSidebarOpen}
                        activeColor={theme.activeColor}
                    />
                    <SidebarItem
                        icon={<Clock size={20} className="shrink-0" />}
                        label="Today's Logs"
                        active={activeTab === "logs"}
                        onClick={() => { setActiveTab("logs"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                        isOpen={isSidebarOpen}
                        activeColor={theme.activeColor}
                    />
                    <SidebarItem
                        icon={<Users size={20} className="shrink-0" />}
                        label="Students Outside"
                        active={activeTab === "outside"}
                        onClick={() => { setActiveTab("outside"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                        isOpen={isSidebarOpen}
                        activeColor={theme.activeColor}
                    />
                    <SidebarItem
                        icon={<Users size={20} className="shrink-0" />}
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
                        <LogOut size={20} className="shrink-0" />
                        {isSidebarOpen && <span className="ml-3 font-medium truncate">Logout</span>}
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
                            <div className="mb-6 flex items-center justify-between gap-4 min-h-[44px]">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-none">
                                            {activeTab === "gate" ? "Gate Entry / Exit" : activeTab === "logs" ? "Today's Logs" : activeTab === "outside" ? "Students Outside" : "Profile"}
                                        </h2>
                                    </div>
                                </div>
                                {headerAction && <div className="shrink-0 flex items-center">{headerAction}</div>}
                            </div>
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
                active ? "text-white" : "text-white/80 hover:bg-white/5"
            } ${!isOpen && "justify-center"}`}
            style={active ? { backgroundColor: activeColor } : undefined}
        >
            {icon}
            {isOpen && <span className="ml-3 truncate">{label}</span>}
        </button>
    );
}
