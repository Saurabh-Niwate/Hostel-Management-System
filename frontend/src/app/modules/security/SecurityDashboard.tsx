import React, { useState } from "react";
import { LogOut, DoorOpen, Clock, Users, ShieldCheck, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";

// Components
import { GateEntryExit } from "./GateEntryExit";
import { TodayLogs } from "./TodayLogs";
import { StudentsOutside } from "./StudentsOutside";
import { StaffProfileSettings } from "../../components/StaffProfileSettings";

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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [logsRefreshKey, setLogsRefreshKey] = useState(0);
    const navigate = useNavigate();

    React.useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("userRole");
        if (!token || role !== "Security") {
            navigate("/");
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userIdentifier");
        navigate("/");
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
        <div className={`min-h-screen ${theme.bg} flex`}>
            <motion.aside
                initial={{ width: 280 }}
                animate={{ width: isSidebarOpen ? 280 : 80 }}
                className="fixed h-full z-20 flex flex-col transition-all duration-300 text-white"
                style={{ backgroundColor: theme.color, borderRight: "1px solid rgba(255,255,255,0.18)" }}
            >
                <div className="p-6 flex items-center justify-between border-b border-white/20">
                    {isSidebarOpen ? (
                        <div className="flex items-center space-x-3">
                            <ShieldCheck className={theme.text} size={24} />
                            <div>
                                <h1 className={`text-xl font-bold tracking-wide truncate ${theme.text}`}>Security Portal</h1>
                                <p className={`text-xs ${theme.muted}`}>{localStorage.getItem("userIdentifier") || "SECURITY"}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center bg-white/15">
                            <ShieldCheck size={18} className="text-white" />
                        </div>
                    )}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg md:hidden text-white">
                        {/* Mobile toggle icon if needed */}
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-6">
                    <SidebarItem
                        icon={<DoorOpen size={20} />}
                        label="Gate Entry / Exit"
                        active={activeTab === "gate"}
                        onClick={() => setActiveTab("gate")}
                        isOpen={isSidebarOpen}
                        activeColor={theme.activeColor}
                    />
                    <SidebarItem
                        icon={<Clock size={20} />}
                        label="Today's Logs"
                        active={activeTab === "logs"}
                        onClick={() => setActiveTab("logs")}
                        isOpen={isSidebarOpen}
                        activeColor={theme.activeColor}
                    />
                    <SidebarItem
                        icon={<Users size={20} />}
                        label="Students Outside"
                        active={activeTab === "outside"}
                        onClick={() => setActiveTab("outside")}
                        isOpen={isSidebarOpen}
                        activeColor={theme.activeColor}
                    />
                    <SidebarItem
                        icon={<Users size={20} />}
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

        <main className={`flex-1 p-8 transition-all duration-300 min-h-[101vh] ${isSidebarOpen ? 'ml-[280px]' : 'ml-[80px]'}`}>
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
                            <h2 className="text-3xl font-bold text-slate-900 leading-none">
                                {activeTab === "gate" ? "Gate Entry / Exit" : activeTab === "logs" ? "Today's Logs" : activeTab === "outside" ? "Students Outside" : "Profile"}
                            </h2>
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
