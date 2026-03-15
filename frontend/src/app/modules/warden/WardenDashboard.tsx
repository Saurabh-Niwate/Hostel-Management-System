import { useEffect, useState } from "react";
import { Users, BedDouble, ClipboardCheck, FileText, LogOut, Menu, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { api } from "../../lib/api";
import { RoomsManagement } from "./RoomsManagement";
import { StudentsManagement } from "./StudentsManagement";
import { AttendanceManagement } from "./AttendanceManagement";
import { LeaveRequests } from "./LeaveRequests";
import { useNavigate } from "react-router-dom";

type TabType = "overview" | "rooms" | "students" | "attendance" | "leaves";

type OverviewStats = {
  totalRooms: number;
  totalStudents: number;
  attendanceMarkedToday: number;
  pendingLeaves: number;
};

const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export function WardenDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<OverviewStats>({
    totalRooms: 0,
    totalStudents: 0,
    attendanceMarkedToday: 0,
    pendingLeaves: 0
  });

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
      } catch {
        setStats({
          totalRooms: 0,
          totalStudents: 0,
          attendanceMarkedToday: 0,
          pendingLeaves: 0
        });
      }
    };
    loadOverview();
  }, []);

  const menuItems = [
    { id: "overview" as TabType, label: "Overview", icon: Users },
    { id: "rooms" as TabType, label: "Rooms", icon: BedDouble },
    { id: "students" as TabType, label: "Students", icon: Users },
    { id: "attendance" as TabType, label: "Attendance", icon: ClipboardCheck },
    { id: "leaves" as TabType, label: "Leave Requests", icon: FileText }
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userIdentifier");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Warden Dashboard</h1>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:block mt-[73px] lg:mt-0`}>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id ? "bg-teal-50 text-teal-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === "overview" && <OverviewTab stats={stats} />}
          {activeTab === "rooms" && <RoomsManagement />}
          {activeTab === "students" && <StudentsManagement />}
          {activeTab === "attendance" && <AttendanceManagement />}
          {activeTab === "leaves" && <LeaveRequests />}
        </main>
      </div>

      {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}
    </div>
  );
}

function OverviewTab({ stats }: { stats: OverviewStats }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        <p className="text-gray-500 mt-1">Room occupancy, attendance, and leave status at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Total Rooms</p><p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalRooms}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Total Students</p><p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStudents}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Attendance Marked Today</p><p className="text-3xl font-bold text-teal-700 mt-2">{stats.attendanceMarkedToday}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Pending Leaves</p><p className="text-3xl font-bold text-amber-600 mt-2">{stats.pendingLeaves}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Warden Access</CardTitle>
          <CardDescription>These actions are read-only except attendance marking.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>View room occupancy and students by room.</p>
          <p>View student basic details and leave status.</p>
          <p>Mark daily attendance room-wise.</p>
        </CardContent>
      </Card>
    </div>
  );
}
