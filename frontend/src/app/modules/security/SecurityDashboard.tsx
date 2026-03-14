import React, { useState } from "react";
import { LogOut, DoorOpen, Clock, Users, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";

// Components
import { GateEntryExit } from "./GateEntryExit";
import { TodayLogs } from "./TodayLogs";
import { StudentsOutside } from "./StudentsOutside";

type Tab = "gate" | "logs" | "outside";

export function SecurityDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>("gate");
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
            case "gate":
                return <GateEntryExit />;
            case "logs":
                return <TodayLogs />;
            case "outside":
                return <StudentsOutside />;
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
                className="bg-slate-900 border-r border-slate-800 text-white fixed h-full z-20 flex flex-col transition-all duration-300"
            >
                <div className="p-6 flex items-center justify-between border-b border-slate-800/50">
                    {isSidebarOpen ? (
                        <div className="flex items-center space-x-3">
                            <ShieldCheck className="text-teal-400" size={24} />
                            <h1 className="text-xl font-bold tracking-wide truncate">Security Portal</h1>
                        </div>
                    ) : (
                        <div className="w-8 h-8 bg-teal-600 rounded-lg mx-auto flex items-center justify-center">
                            <ShieldCheck size={18} />
                        </div>
                    )}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg md:hidden">
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
                    />
                    <SidebarItem
                        icon={<Clock size={20} />}
                        label="Today's Logs"
                        active={activeTab === "logs"}
                        onClick={() => setActiveTab("logs")}
                        isOpen={isSidebarOpen}
                    />
                    <SidebarItem
                        icon={<Users size={20} />}
                        label="Students Outside"
                        active={activeTab === "outside"}
                        onClick={() => setActiveTab("outside")}
                        isOpen={isSidebarOpen}
                    />
                </nav>

                <div className="p-4 border-t border-slate-800/50">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full p-3 text-red-400 hover:bg-red-900/30 rounded-xl transition-colors ${!isSidebarOpen && 'justify-center'}`}
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
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-900/50"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                } ${!isOpen && 'justify-center'}`}
        >
            {icon}
            {isOpen && <span className="ml-3 font-medium">{label}</span>}
        </button>
    );
}
