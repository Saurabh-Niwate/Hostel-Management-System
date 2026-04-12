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
  GraduationCap,
  Plus,
  Menu,
  X,
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

type NearbyStay = {
  ACCOMMODATION_ID: number;
  NAME: string;
  ACCOMMODATION_TYPE: string;
  ADDRESS: string;
  DISTANCE_KM?: number | null;
  CONTACT_PHONE?: string | null;
  RENT_MIN?: number | null;
  RENT_MAX?: number | null;
  GENDER_ALLOWED?: string;
  AVAILABILITY_STATUS: string;
};

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  theme: {
    color: string;
    activeColor: string;
    bg: string;
    text: string;
    muted: string;
  };
};

export function StudentDashboard() {
  const theme = {
    color: "#047857",
    activeColor: "#059669",
    bg: "bg-emerald-50",
    text: "text-white",
    muted: "text-white/80",
  };
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [leaveInitialTab, setLeaveInitialTab] = useState<"list" | "apply">("list");
  const [leaveViewTab, setLeaveViewTab] = useState<"list" | "apply">("list");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [profile, setProfile] = useState<ProfileSnapshot>({ roomNo: "" });
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [nearbyStays, setNearbyStays] = useState<NearbyStay[]>([]);
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
        const [leavesRes, profileRes, attendanceRes, feesRes, menuRes, staysRes] = await Promise.allSettled([
          api.get("/leave/my-leaves"),
          api.get("/student/profile"),
          api.get("/student/attendance"),
          api.get("/student/fees"),
          api.get("/student/canteen-menu"),
          api.get("/student/nearby-stays"),
        ]);

        const leaveRows = leavesRes.status === "fulfilled" ? leavesRes.value.data?.leaves || [] : [];
        const mappedLeaves = leaveRows.map((row: any) => ({
          id: String(row.LEAVE_ID),
          type: row.LEAVE_TYPE || "General",
          fromDate: row.FROM_DATE || "",
          toDate: row.TO_DATE || "",
          status: row.STATUS as LeaveStatus,
        }));
        setLeaves(mappedLeaves);

        const roomNo = profileRes.status === "fulfilled" ? profileRes.value.data?.profile?.ROOM_NO || "" : "";
        setProfile({ roomNo });
        setAttendance(attendanceRes.status === "fulfilled" ? attendanceRes.value.data?.attendance || [] : []);
        setFees(feesRes.status === "fulfilled" ? feesRes.value.data?.fees || [] : []);
        setMenu(menuRes.status === "fulfilled" ? menuRes.value.data?.menu || [] : []);
        setNearbyStays(staysRes.status === "fulfilled" ? staysRes.value.data?.accommodations || [] : []);
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
    const total = attendance.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, total, percentage };
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
    localStorage.removeItem("userIdentifier");
    navigate("/");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
                <h3 className="text-slate-500 text-sm font-medium">Total Leaves</h3>
                <p className="text-3xl font-bold text-emerald-700 mt-2">{leaveStats.total}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
                <h3 className="text-slate-500 text-sm font-medium">Pending Approvals</h3>
                <p className="text-3xl font-bold text-amber-500 mt-2">{leaveStats.pending}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
                <h3 className="text-slate-500 text-sm font-medium">Approved Leaves</h3>
                <p className="text-3xl font-bold text-emerald-500 mt-2">{leaveStats.approved}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
                <h3 className="text-slate-500 text-sm font-medium">Room Number</h3>
                <p className="text-3xl font-bold text-emerald-600 mt-2">{profile.roomNo || "N/A"}</p>
              </div>
            </div>

            {!profile.roomNo && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Nearby Stay Suggestions</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Hostel room is not assigned yet. These nearby manual suggestions can help for temporary stay.
                    </p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800">
                    Room Not Assigned
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  No hostel room is assigned to your account yet. Until a room is allotted, you can check these nearby stay options shared by technical staff.
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {nearbyStays.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      No nearby stay suggestions are available right now.
                    </div>
                  ) : (
                    nearbyStays.slice(0, 3).map((stay) => (
                      <div key={stay.ACCOMMODATION_ID} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="font-semibold text-slate-900">{stay.NAME}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {stay.ACCOMMODATION_TYPE} | {stay.GENDER_ALLOWED || "Any"} | {stay.AVAILABILITY_STATUS}
                        </p>
                        <p className="mt-3 text-sm text-slate-700"><span className="font-medium">Address:</span> {stay.ADDRESS}</p>
                        <p className="text-sm text-slate-700"><span className="font-medium">Distance:</span> {stay.DISTANCE_KM ?? "-"} km</p>
                        <p className="text-sm text-slate-700"><span className="font-medium">Phone:</span> {stay.CONTACT_PHONE || "-"}</p>
                        <p className="text-sm text-slate-700"><span className="font-medium">Rent:</span> {stay.RENT_MIN ?? "-"} - {stay.RENT_MAX ?? "-"}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => {
                  setLeaveInitialTab("apply");
                  setActiveTab("leave");
                }}
                className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm text-left hover:border-emerald-300"
              >
                <p className="text-sm text-slate-500">Quick Action</p>
                <p className="font-semibold text-slate-800 mt-1">Apply New Leave</p>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  Open leave form <ArrowRight size={14} />
                </p>
              </button>
              <button
                onClick={() => setActiveTab("fees")}
                className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm text-left hover:border-emerald-300"
              >
                <p className="text-sm text-slate-500">Pending Fees</p>
                <p className="font-semibold text-slate-800 mt-1">Rs {feeStats.pendingAmount.toLocaleString()}</p>
                <p className="text-xs text-rose-600 mt-2">{feeStats.overdueCount} overdue record(s)</p>
              </button>
              <button
                onClick={() => setActiveTab("canteen")}
                className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm text-left hover:border-emerald-300"
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
                  <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center justify-center lg:justify-start">
                      <div
                        className="relative flex h-28 w-28 items-center justify-center rounded-full"
                        style={{
                          background: `conic-gradient(#10b981 ${attendanceStats.percentage}%, #e2e8f0 0)`
                        }}
                      >
                        <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white">
                          <span className="text-2xl font-bold text-slate-900">{attendanceStats.percentage}%</span>
                          <span className="text-[11px] text-slate-500">Present</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid flex-1 grid-cols-2 gap-4">
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                        <p className="text-sm text-slate-500">Present Records</p>
                        <p className="mt-2 text-2xl font-bold text-emerald-600">{attendanceStats.present}</p>
                      </div>
                      <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
                        <p className="text-sm text-slate-500">Absent Records</p>
                        <p className="mt-2 text-2xl font-bold text-rose-600">{attendanceStats.absent}</p>
                      </div>
                      <div className="col-span-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                          <p className="text-sm text-slate-500">Total Attendance Entries</p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">{attendanceStats.total}</p>
                        </div>
                        <CalendarCheck className="text-slate-300" size={28} />
                      </div>
                    </div>
                  </div>
                </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800">Recent Leave Requests</h3>
                <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
                  {leaves.slice(0, 3).length === 0 ? (
                    <p className="text-sm text-slate-500">No leave request yet.</p>
                  ) : (
                    leaves.slice(0, 3).map((leave) => (
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
            onTabChange={setLeaveViewTab}
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

  const headerAction =
    activeTab === "leave" ? (
      leaveViewTab === "list" ? (
        <button
          onClick={() => setLeaveInitialTab("apply")}
          className="flex items-center px-4 py-2 bg-emerald-700 text-white rounded-xl hover:bg-emerald-600 transition-all font-medium"
        >
          <Plus size={18} className="mr-2" />
          Apply New Leave
        </button>
      ) : (
        <button
          onClick={() => setLeaveInitialTab("list")}
          className="px-4 py-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium"
        >
          Cancel
        </button>
      )
    ) : null;

  return (
    <div className={`min-h-screen ${theme.bg} flex`}>
      <motion.aside
        initial={{ width: 280 }}
        animate={{ width: 280 }}
        className={`fixed top-0 left-0 h-full w-[280px] flex flex-col transition-transform duration-300 text-white z-30 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ backgroundColor: theme.color, borderRight: "1px solid rgba(255,255,255,0.18)" }}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between border-b border-white/20">
            <div className="flex items-center gap-3">
              <GraduationCap className={`h-5 w-5 ${theme.text}`} />
              <div>
                <h1 className={`text-xl font-bold tracking-wide truncate ${theme.text}`}>Student Portal</h1>
                <p className={`text-xs ${theme.muted}`}>{localStorage.getItem("userIdentifier") || "STUDENT"}</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg lg:hidden ${theme.text} hover:bg-white/10`}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <SidebarItem
              icon={<LayoutDashboard className="w-5 h-5" />}
              label="Dashboard"
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
              theme={theme}
            />
            <SidebarItem
              icon={<FileText className="w-5 h-5" />}
              label="Leave Management"
              active={activeTab === "leave"}
              onClick={() => {
                setLeaveInitialTab("list");
                setActiveTab("leave");
              }}
              theme={theme}
            />
            <SidebarItem
              icon={<CalendarCheck className="w-5 h-5" />}
              label="Attendance"
              active={activeTab === "attendance"}
              onClick={() => setActiveTab("attendance")}
              theme={theme}
            />
            <SidebarItem
              icon={<CreditCard className="w-5 h-5" />}
              label="Fees"
              active={activeTab === "fees"}
              onClick={() => setActiveTab("fees")}
              theme={theme}
            />
            <SidebarItem
              icon={<MessageSquare className="w-5 h-5" />}
              label="Feedback"
              active={activeTab === "feedback"}
              onClick={() => setActiveTab("feedback")}
              theme={theme}
            />
            <SidebarItem
              icon={<Coffee className="w-5 h-5" />}
              label="Canteen Menu"
              active={activeTab === "canteen"}
              onClick={() => setActiveTab("canteen")}
              theme={theme}
            />
            <SidebarItem
              icon={<User className="w-5 h-5" />}
              label="Profile"
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
              theme={theme}
            />
          </nav>

          <div className="p-4 border-t border-white/20">
            <button
              onClick={handleLogout}
              className="flex items-center w-full gap-3 px-4 py-3 bg-white text-slate-800 hover:bg-slate-100 rounded-xl font-medium transition-colors border border-slate-200 shadow-sm"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 p-8 ml-0 lg:ml-[280px] transition-all duration-300 min-h-[101vh]">
        <div className="max-w-5xl mx-auto">
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
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="lg:hidden p-2 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-sm"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 leading-none">
                      {activeTab === "dashboard"
                        ? "Student Dashboard"
                        : activeTab === "profile"
                          ? "My Profile"
                          : activeTab === "leave"
                            ? "Leave Management"
                            : activeTab === "attendance"
                              ? "Attendance"
                              : activeTab === "fees"
                                ? "Fee Status"
                                : activeTab === "feedback"
                                  ? "Feedback"
                                  : "Canteen Menu"}
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

function SidebarItem({ icon, label, active, onClick, theme }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
        active
          ? "text-white shadow-lg"
          : `${theme.text} hover:bg-white/10`
      }`}
      style={active ? { backgroundColor: theme.activeColor } : undefined}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
