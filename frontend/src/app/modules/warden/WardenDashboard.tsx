import { useEffect, useState } from "react";
import { Users, BedDouble, ClipboardCheck, FileText, LogOut, Menu, X, ShieldCheck, ArrowRight, Clock3, MessageSquare, User, ShieldAlert, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../../lib/api";
import { RoomsManagement } from "./RoomsManagement";
import { StudentsManagement } from "./StudentsManagement";
import { AttendanceManagement } from "./AttendanceManagement";
import { LeaveRequests } from "./LeaveRequests";
import { FeedbackManagement } from "./FeedbackManagement";
import { StaffProfileSettings } from "../../components/StaffProfileSettings";
import { useNavigate } from "react-router-dom";
import { clearAuthSession, getStoredIdentifier, getStoredRole, getStoredToken } from "../../lib/authStorage";
import { socket } from "../../lib/socket";
import { toast } from "sonner";

type TabType = "overview" | "rooms" | "students" | "attendance" | "leaves" | "feedback" | "profile";

type SecurityAnomaly = {
  id: string;
  studentId: string;
  fullName: string;
  roomNo: string;
  phone: string;
  guardianPhone: string;
  type: string;
  severity: "HIGH" | "MEDIUM";
  reason: string;
  time: string;
};

type OverviewStats = {
  totalRooms: number;
  totalStudents: number;
  attendanceMarkedToday: number;
  pendingLeaves: number;
};

type OverviewActivity = {
  id: string;
  time: string;
  action: string;
  details: string;
  status: string;
};

const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export function WardenDashboard() {
  const theme = {
    color: "#6d28d9",
    activeColor: "#a78bfa",
    bg: "bg-violet-50",
  };
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const [stats, setStats] = useState<OverviewStats>({
    totalRooms: 0,
    totalStudents: 0,
    attendanceMarkedToday: 0,
    pendingLeaves: 0
  });
  const [recentActivities, setRecentActivities] = useState<OverviewActivity[]>([]);
  const [anomalies, setAnomalies] = useState<SecurityAnomaly[]>([]);

  const loadOverview = async () => {
    try {
      const [roomsRes, studentsRes, attendanceRes, leavesRes, anomaliesRes] = await Promise.all([
        api.get("/warden/rooms"),
        api.get("/warden/students"),
        api.get(`/warden/attendance/date/${today}`),
        api.get("/warden/leave-status", { params: { status: "Pending" } }),
        api.get("/warden/anomalies")
      ]);

      setStats({
        totalRooms: (roomsRes.data?.rooms || []).length,
        totalStudents: (studentsRes.data?.students || []).length,
        attendanceMarkedToday: (attendanceRes.data?.attendance || []).length,
        pendingLeaves: (leavesRes.data?.leaves || []).length
      });
      setAnomalies(anomaliesRes.data?.anomalies || []);
      const recentLeaves = (leavesRes.data?.leaves || []).slice(0, 4).map((leave: any) => ({
        id: `leave-${leave.LEAVE_ID}`,
        time: leave.CREATED_AT || "-",
        action: `${leave.LEAVE_TYPE || "Leave"} Request`,
        details: `${leave.FULL_NAME || leave.STUDENT_ID || "Student"} | ${leave.FROM_DATE || "-"} to ${leave.TO_DATE || "-"}`,
        status: leave.STATUS || "Pending"
      }));
      const attendanceActivity =
        (attendanceRes.data?.attendance || []).length > 0
          ? [
              {
                id: "attendance-today",
                time: today,
                action: "Attendance Loaded",
                details: `${(attendanceRes.data?.attendance || []).length} student attendance record(s) found for ${today}`,
                status: "Marked"
              }
            ]
          : [];
      setRecentActivities([...attendanceActivity, ...recentLeaves]);
    } catch {
      setStats({
        totalRooms: 0,
        totalStudents: 0,
        attendanceMarkedToday: 0,
        pendingLeaves: 0
      });
      setRecentActivities([]);
      setAnomalies([]);
    }
  };

  useEffect(() => {
    const token = getStoredToken();
    const role = getStoredRole();
    if (!token || role !== "Warden") {
      navigate("/");
      return;
    }

    loadOverview();

    socket.connect();
    socket.on("gatePassLogged", (data: any) => {
      toast.info(`Gate Alert: Student ${data.studentName} (${data.studentId}) has checked ${data.type}! ${data.remarks ? 'Remarks: ' + data.remarks : ''}`, {
        duration: 8000
      });
      loadOverview();
    });

    return () => {
      socket.off("gatePassLogged");
      socket.disconnect();
    };
  }, [navigate]);

  const menuItems = [
    { id: "overview" as TabType, label: "Overview", icon: Users },
    { id: "rooms" as TabType, label: "Rooms", icon: BedDouble },
    { id: "students" as TabType, label: "Students", icon: Users },
    { id: "attendance" as TabType, label: "Attendance", icon: ClipboardCheck },
    { id: "leaves" as TabType, label: "Leave Requests", icon: FileText },
    { id: "feedback" as TabType, label: "Feedback", icon: MessageSquare },
    { id: "profile" as TabType, label: "Profile", icon: User }
  ];

  const handleLogout = () => {
    api.post("/auth/logout").catch(() => undefined).finally(() => {
      clearAuthSession();
      navigate("/");
    });
  };

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col md:flex-row`}>
      {/* Mobile Top Navbar */}
      <header className="md:hidden flex h-16 items-center justify-between px-6 text-white z-20 shadow-md w-full shrink-0" style={{ backgroundColor: theme.color }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-lg">
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold tracking-wide">Warden Portal</h1>
        </div>
        <div className="text-xs text-white/80 font-medium">{getStoredIdentifier() || "WARDEN"}</div>
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
              <h1 className="text-xl font-bold tracking-wide truncate">Warden Portal</h1>
              <p className="text-xs text-white/80 truncate">{getStoredIdentifier() || "WARDEN"}</p>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center bg-white/15">
              <ShieldCheck className="h-5 w-5 text-white" />
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
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center p-3 rounded-xl transition-colors font-medium ${
                  activeTab === item.id ? "text-white" : "text-white/80 hover:bg-white/5"
                } ${!isSidebarOpen && "justify-center"}`}
                style={activeTab === item.id ? { backgroundColor: theme.activeColor } : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {isSidebarOpen && <span className="ml-3 truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/20">
          <button
            onClick={handleLogout}
            className={`flex items-center w-full p-3 bg-white text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shadow-sm ${!isSidebarOpen && 'justify-center'}`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
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
                      {menuItems.find((item) => item.id === activeTab)?.label || "Warden Dashboard"}
                    </h2>
                  </div>
                </div>
              </div>
              {activeTab === "overview" && <OverviewTab stats={stats} onNavigate={setActiveTab} recentActivities={recentActivities} anomalies={anomalies} />}
              {activeTab === "rooms" && <RoomsManagement />}
              {activeTab === "students" && <StudentsManagement />}
              {activeTab === "attendance" && <AttendanceManagement />}
              {activeTab === "leaves" && <LeaveRequests />}
              {activeTab === "feedback" && <FeedbackManagement />}
              {activeTab === "profile" && <StaffProfileSettings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function OverviewTab({
  stats,
  onNavigate,
  recentActivities,
  anomalies
}: {
  stats: OverviewStats;
  onNavigate: (tab: TabType) => void;
  recentActivities: OverviewActivity[];
  anomalies: SecurityAnomaly[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 sm:p-5 md:p-6"><p className="text-xs sm:text-sm text-gray-500 truncate">Total Rooms</p><p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-2">{stats.totalRooms}</p></CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5 md:p-6"><p className="text-xs sm:text-sm text-gray-500 truncate">Total Students</p><p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-2">{stats.totalStudents}</p></CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5 md:p-6"><p className="text-xs sm:text-sm text-gray-500 truncate">Attendance Today</p><p className="text-xl sm:text-2xl md:text-3xl font-bold text-violet-700 mt-2">{stats.attendanceMarkedToday}</p></CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5 md:p-6"><p className="text-xs sm:text-sm text-gray-500 truncate">Pending Leaves</p><p className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-600 mt-2">{stats.pendingLeaves}</p></CardContent></Card>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate("attendance")}
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left"
          >
            <div className="p-2 bg-violet-100 rounded-lg">
              <ClipboardCheck className="h-5 w-5 text-violet-700" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Mark Attendance</p>
              <p className="text-sm text-slate-600">Open room-wise attendance management</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate("rooms")}
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left"
          >
            <div className="p-2 bg-violet-100 rounded-lg">
              <BedDouble className="h-5 w-5 text-violet-700" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Check Rooms</p>
              <p className="text-sm text-slate-600">View occupancy and room status</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate("leaves")}
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left"
          >
            <div className="p-2 bg-violet-100 rounded-lg">
              <FileText className="h-5 w-5 text-violet-700" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Review Leave Status</p>
              <p className="text-sm text-slate-600">See pending and approved student leave records</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate("feedback")}
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left"
          >
            <div className="p-2 bg-violet-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-violet-700" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Handle Feedback</p>
              <p className="text-sm text-slate-600">Review student complaints and update their status</p>
            </div>
          </button>
        </div>
      </div>

      {/* AI Security Insights & Alerts */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/30">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-rose-500" />
              AI Security Insights & Alerts
            </h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-semibold">
            {anomalies.length} Flagged
          </span>
        </div>
        <div className="p-6">
          {anomalies.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">
              All students accounted for. No gate security anomalies detected.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {anomalies.map((anomaly) => (
                <div 
                  key={anomaly.id} 
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-4 transition-all shadow-sm ${
                    anomaly.severity === "HIGH" 
                      ? "border-rose-100 bg-rose-50/10 hover:bg-rose-50/20" 
                      : "border-amber-100 bg-amber-50/10 hover:bg-amber-50/20"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-sm ${
                        anomaly.severity === "HIGH" 
                          ? "bg-rose-100 text-rose-800" 
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {anomaly.type}
                      </span>
                      <span className="text-xs text-slate-500">{anomaly.time.substring(5, 16)}</span>
                    </div>
                    <h4 className="font-bold text-slate-800">{anomaly.fullName} ({anomaly.studentId})</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Room {anomaly.roomNo}</p>
                    <p className="text-sm text-slate-600 mt-2 bg-white/50 p-2.5 rounded-lg border border-slate-100 font-medium">
                      {anomaly.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100/50">
                    {anomaly.phone && (
                      <a 
                        href={`tel:${anomaly.phone}`}
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Phone size={12} />
                        Call Student
                      </a>
                    )}
                    {anomaly.guardianPhone && (
                      <a 
                        href={`tel:${anomaly.guardianPhone}`}
                        className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <ShieldAlert size={12} />
                        Alert Guardian
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Time</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Action</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Details</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentActivities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-sm text-slate-500 text-center">
                    No recent activity available
                  </td>
                </tr>
              ) : (
                recentActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm text-slate-600">{activity.time}</td>
                    <td className="px-6 py-3 text-sm font-medium text-slate-900">{activity.action}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{activity.details}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        activity.status === "Pending"
                          ? "bg-amber-100 text-amber-700"
                          : activity.status === "Approved" || activity.status === "Marked"
                            ? "bg-violet-100 text-violet-700"
                            : "bg-slate-100 text-slate-700"
                      }`}>
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
