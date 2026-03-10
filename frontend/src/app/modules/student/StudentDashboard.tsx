import React, { useEffect, useMemo, useState } from "react";
import {
  User,
  LogOut,
  FileText,
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  Coffee,
  ArrowRight,
  Clock3,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { StudentProfile } from "./StudentProfile";
import { LeaveManagement } from "./LeaveManagement";
import { AttendanceView } from "./AttendanceView";
import { FeesView } from "./FeesView";
import { FeedbackView } from "./FeedbackView";
import { CanteenMenuView } from "./CanteenMenuView";
import { api } from "../../lib/api";

type Tab = "dashboard" | "profile" | "leave" | "attendance" | "fees" | "feedback" | "canteen";
type LeaveStatus = "Pending" | "Approved" | "Rejected";

type LeaveItem = {
  id: string;
  type: string;
  fromDate: string;
  toDate: string;
  status: LeaveStatus;
};

type ProfileSnapshot = {
  roomNo: string;
};

type AttendanceItem = {
  STATUS: string;
};

type FeeItem = {
  AMOUNT_DUE: number;
  STATUS: string;
};

type MenuItem = {
  IS_AVAILABLE: number | string | boolean;
};

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  isOpen: boolean;
};

export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [leaveInitialTab, setLeaveInitialTab] = useState<"list" | "apply">("list");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [profile, setProfile] = useState<ProfileSnapshot>({ roomNo: "" });
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
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
        const [leavesRes, profileRes, attendanceRes, feesRes, menuRes] = await Promise.all([
          api.get("/leave/my-leaves"),
          api.get("/student/profile"),
          api.get("/student/attendance"),
          api.get("/student/fees"),
          api.get("/student/canteen-menu"),
        ]);

        const mappedLeaves = (leavesRes.data?.leaves || []).map((row: any) => ({
          id: String(row.LEAVE_ID),
          type: row.LEAVE_TYPE || "General",
          fromDate: row.FROM_DATE || "",
          toDate: row.TO_DATE || "",
          status: row.STATUS as LeaveStatus,
        }));
        setLeaves(mappedLeaves);

        const roomNo = profileRes.data?.profile?.ROOM_NO || "";
        setProfile({ roomNo });
        setAttendance(attendanceRes.data?.attendance || []);
        setFees(feesRes.data?.fees || []);
        setMenu(menuRes.data?.menu || []);
      } catch {
        // Keep dashboard lightweight; dedicated pages handle detailed errors.
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

  const attendanceStats = useMemo(() => {
    const present = attendance.filter((a) => String(a.STATUS || "").toLowerCase() === "present").length;
    const absent = attendance.filter((a) => String(a.STATUS || "").toLowerCase() === "absent").length;
    return { present, absent };
  }, [attendance]);

  const feeStats = useMemo(() => {
    const pendingAmount = fees
      .filter((f) => String(f.STATUS || "").toLowerCase() !== "paid")
      .reduce((sum, f) => sum + Number(f.AMOUNT_DUE || 0), 0);
    const overdueCount = fees.filter((f) => String(f.STATUS || "").toLowerCase() === "overdue").length;
    return { pendingAmount, overdueCount };
  }, [fees]);

  const menuStats = useMemo(() => {
    const isAvailable = (value: number | string | boolean) => {
      if (typeof value === "boolean") return value;
      if (typeof value === "number") return value === 1;
      const normalized = String(value || "").toLowerCase();
      return normalized === "1" || normalized === "y" || normalized === "yes" || normalized === "true";
    };

    const available = menu.filter((m) => isAvailable(m.IS_AVAILABLE)).length;
    return { total: menu.length, available };
  }, [menu]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => {
                  setLeaveInitialTab("apply");
                  setActiveTab("leave");
                }}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-left hover:border-blue-200"
              >
                <p className="text-sm text-slate-500">Quick Action</p>
                <p className="font-semibold text-slate-800 mt-1">Apply New Leave</p>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  Open leave form <ArrowRight size={14} />
                </p>
              </button>
              <button
                onClick={() => setActiveTab("fees")}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-left hover:border-blue-200"
              >
                <p className="text-sm text-slate-500">Pending Fees</p>
                <p className="font-semibold text-slate-800 mt-1">Rs {feeStats.pendingAmount.toLocaleString()}</p>
                <p className="text-xs text-rose-600 mt-2">{feeStats.overdueCount} overdue record(s)</p>
              </button>
              <button
                onClick={() => setActiveTab("canteen")}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-left hover:border-blue-200"
              >
                <p className="text-sm text-slate-500">Today&apos;s Meals</p>
                <p className="font-semibold text-slate-800 mt-1">
                  {menuStats.available} of {menuStats.total} available
                </p>
                <p className="text-xs text-slate-500 mt-2">Tap to view full menu</p>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800">Attendance Snapshot</h3>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Present Records</p>
                    <p className="text-2xl font-bold text-emerald-600">{attendanceStats.present}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Absent Records</p>
                    <p className="text-2xl font-bold text-rose-600">{attendanceStats.absent}</p>
                  </div>
                  <CalendarCheck className="text-slate-300" size={28} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800">Recent Leave Requests</h3>
                <div className="mt-4 space-y-3">
                  {leaves.slice(0, 4).length === 0 ? (
                    <p className="text-sm text-slate-500">No leave request yet.</p>
                  ) : (
                    leaves.slice(0, 4).map((leave) => (
                      <div key={leave.id} className="flex items-center justify-between border border-slate-100 rounded-lg p-3">
                        <div>
                          <p className="font-medium text-slate-800">{leave.type}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock3 size={13} /> {leave.fromDate || "-"} to {leave.toDate || "-"}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            leave.status === "Approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : leave.status === "Pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {leave.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-sky-50 to-emerald-50 border border-sky-100 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-slate-700 font-semibold">Need quick access?</p>
                <p className="text-sm text-slate-600 mt-1">Open profile to keep room and contact info up to date.</p>
              </div>
              <button
                onClick={() => setActiveTab("profile")}
                className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:border-slate-300"
              >
                <User size={16} />
                Open Profile
              </button>
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
            initialTab={leaveInitialTab}
            onLeavesUpdated={(updatedLeaves) => {
              setLeaves(
                updatedLeaves.map((l) => ({
                  id: l.id,
                  type: l.type,
                  fromDate: l.startDate,
                  toDate: l.endDate,
                  status: l.status,
                }))
              );
            }}
          />
        );
      case "attendance":
        return <AttendanceView />;
      case "fees":
        return <FeesView />;
      case "feedback":
        return <FeedbackView />;
      case "canteen":
        return <CanteenMenuView />;
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
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg md:hidden"
          />
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
            onClick={() => {
              setLeaveInitialTab("list");
              setActiveTab("leave");
            }}
            isOpen={isSidebarOpen}
          />
          <SidebarItem
            icon={<CalendarCheck size={20} />}
            label="Attendance"
            active={activeTab === "attendance"}
            onClick={() => setActiveTab("attendance")}
            isOpen={isSidebarOpen}
          />
          <SidebarItem
            icon={<CreditCard size={20} />}
            label="Fees"
            active={activeTab === "fees"}
            onClick={() => setActiveTab("fees")}
            isOpen={isSidebarOpen}
          />
          <SidebarItem
            icon={<MessageSquare size={20} />}
            label="Feedback"
            active={activeTab === "feedback"}
            onClick={() => setActiveTab("feedback")}
            isOpen={isSidebarOpen}
          />
          <SidebarItem
            icon={<Coffee size={20} />}
            label="Canteen Menu"
            active={activeTab === "canteen"}
            onClick={() => setActiveTab("canteen")}
            isOpen={isSidebarOpen}
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className={`flex items-center w-full p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors ${
              !isSidebarOpen ? "justify-center" : ""
            }`}
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

function SidebarItem({ icon, label, active, onClick, isOpen }: SidebarItemProps) {
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
