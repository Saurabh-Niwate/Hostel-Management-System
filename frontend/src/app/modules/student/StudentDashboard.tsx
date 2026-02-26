import React, { useEffect, useMemo, useState } from "react";
import { User, LogOut, FileText, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { StudentProfile } from "./StudentProfile";
import { LeaveManagement } from "./LeaveManagement";
import { api } from "../../lib/api";

type Tab = "dashboard" | "profile" | "leave";
type LeaveStatus = "Pending" | "Approved" | "Rejected";

type LeaveItem = {
  id: string;
  status: LeaveStatus;
};

type ProfileSnapshot = {
  roomNo: string;
};

export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [profile, setProfile] = useState<ProfileSnapshot>({ roomNo: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    if (!token || role !== "Student") {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [leavesRes, profileRes] = await Promise.all([
          api.get("/leave/my-leaves"),
          api.get("/student/profile"),
        ]);

        const mappedLeaves = (leavesRes.data.leaves || []).map((row: any) => ({
          id: String(row.LEAVE_ID),
          status: row.STATUS as LeaveStatus,
        }));
        setLeaves(mappedLeaves);

        const roomNo = profileRes.data?.profile?.ROOM_NO || "";
        setProfile({ roomNo });
      } catch {
        // Keep dashboard lightweight; per-tab pages already show explicit errors.
      }
    };

    loadDashboardData();
  }, []);

  const leaveStats = useMemo(() => {
    const total = leaves.length;
    const pending = leaves.filter((l) => l.status === "Pending").length;
    const approved = leaves.filter((l) => l.status === "Approved").length;
    return { total, pending, approved };
  }, [leaves]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userIdentifier");
    navigate("/");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-slate-500 text-sm font-medium">Total Leaves</h3>
                <p className="text-3xl font-bold text-slate-800 mt-2">{leaveStats.total}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-slate-500 text-sm font-medium">Pending Approvals</h3>
                <p className="text-3xl font-bold text-amber-500 mt-2">{leaveStats.pending}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-slate-500 text-sm font-medium">Approved Leaves</h3>
                <p className="text-3xl font-bold text-emerald-500 mt-2">{leaveStats.approved}</p>
                <p className="text-xs text-slate-500 mt-2">Room: {profile.roomNo || "N/A"}</p>
              </div>
            </div>
          </div>
        );
      case "profile":
        return (
          <StudentProfile
            onProfileUpdated={(p) => {
              setProfile({ roomNo: p.roomNo });
            }}
          />
        );
      case "leave":
        return (
          <LeaveManagement
            onLeavesUpdated={(updatedLeaves) => {
              setLeaves(updatedLeaves.map((l) => ({ id: l.id, status: l.status })));
            }}
          />
        );
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <motion.aside
        initial={{ width: 280 }}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-white border-r border-slate-200 fixed h-full z-20 flex flex-col transition-all duration-300"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen ? (
            <h1 className="text-xl font-bold text-slate-800 truncate">Hostel Portal</h1>
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-lg mx-auto" />
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg md:hidden" />
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            isOpen={isSidebarOpen}
          />
          <SidebarItem
            icon={<User size={20} />}
            label="Profile"
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
            isOpen={isSidebarOpen}
          />
          <SidebarItem
            icon={<FileText size={20} />}
            label="Leave Management"
            active={activeTab === "leave"}
            onClick={() => setActiveTab("leave")}
            isOpen={isSidebarOpen}
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className={`flex items-center w-full p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors ${!isSidebarOpen ? "justify-center" : ""}`}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="ml-3 font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      <main className={`flex-1 p-8 transition-all duration-300 ${isSidebarOpen ? "ml-[280px]" : "ml-[80px]"}`}>
        <div className="max-w-5xl mx-auto">
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

function SidebarItem({
  icon,
  label,
  active,
  onClick,
  isOpen,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  isOpen: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full p-3 rounded-xl transition-all duration-200 ${
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      } ${!isOpen ? "justify-center" : ""}`}
    >
      {icon}
      {isOpen && <span className="ml-3 font-medium">{label}</span>}
    </button>
  );
}
