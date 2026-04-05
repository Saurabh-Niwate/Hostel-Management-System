import { useEffect, useState } from "react";
import { Users, BedDouble, ClipboardCheck, FileText, LogOut, Menu, X, ShieldCheck, ArrowRight, Clock3, MessageSquare, User } from "lucide-react";
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

type TabType = "overview" | "rooms" | "students" | "attendance" | "leaves" | "feedback" | "profile";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<OverviewStats>({
    totalRooms: 0,
    totalStudents: 0,
    attendanceMarkedToday: 0,
    pendingLeaves: 0
  });
  const [recentActivities, setRecentActivities] = useState<OverviewActivity[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    if (!token || role !== "Warden") {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const [roomsRes, studentsRes, attendanceRes, leavesRes] = await Promise.all([
          api.get("/warden/rooms"),
          api.get("/warden/students"),
          api.get(`/warden/attendance/date/${today}`),
          api.get("/warden/leave-status", { params: { status: "Pending" } })
        ]);

        setStats({
          totalRooms: (roomsRes.data?.rooms || []).length,
          totalStudents: (studentsRes.data?.students || []).length,
          attendanceMarkedToday: (attendanceRes.data?.attendance || []).length,
          pendingLeaves: (leavesRes.data?.leaves || []).length
        });
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
      }
    };
    loadOverview();
  }, []);

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
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userIdentifier");
    navigate("/");
  };

  return (
    <div className={`min-h-screen ${theme.bg} flex`}>
      <motion.aside
        initial={{ width: 280 }}
        animate={{ width: 280 }}
        className={`${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 text-white fixed h-full z-30 flex flex-col transition-transform duration-300`}
        style={{ backgroundColor: theme.color, borderRight: "1px solid rgba(255,255,255,0.18)" }}
      >
        <div className="p-6 flex items-center justify-between border-b border-white/20">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-white" />
            <div>
              <h1 className="text-xl font-bold tracking-wide truncate">Warden Portal</h1>
              <p className="text-xs text-white/80">{localStorage.getItem("userIdentifier") || "WARDEN"}</p>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-white/10 rounded-lg lg:hidden">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === item.id ? "text-white shadow-lg" : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
                style={activeTab === item.id ? { backgroundColor: theme.activeColor } : undefined}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/20">
          <button onClick={handleLogout} className="flex items-center w-full p-3 bg-white text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shadow-sm">
            <LogOut className="h-5 w-5" />
            <span className="ml-3 font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 p-8 ml-0 lg:ml-[280px] transition-all duration-300">
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-slate-900">
                {menuItems.find((item) => item.id === activeTab)?.label || "Warden Dashboard"}
              </h2>
            </div>
            <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "overview" && <OverviewTab stats={stats} onNavigate={setActiveTab} recentActivities={recentActivities} />}
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

      {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}
    </div>
  );
}

function OverviewTab({
  stats,
  onNavigate,
  recentActivities
}: {
  stats: OverviewStats;
  onNavigate: (tab: TabType) => void;
  recentActivities: OverviewActivity[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Total Rooms</p><p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalRooms}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Total Students</p><p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStudents}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Attendance Marked Today</p><p className="text-3xl font-bold text-violet-700 mt-2">{stats.attendanceMarkedToday}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Pending Leaves</p><p className="text-3xl font-bold text-amber-600 mt-2">{stats.pendingLeaves}</p></CardContent></Card>
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

