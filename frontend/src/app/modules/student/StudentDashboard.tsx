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
import { clearAuthSession, getStoredIdentifier, getStoredRole, getStoredToken } from "../../lib/authStorage";
import { socket } from "../../lib/socket";
import { toast } from "sonner";

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

type RoomAllocationStatus = {
  hasAssignedRoom: boolean;
  roomNo?: string | null;
  totalVacancy: number;
  hasPendingRequest: boolean;
  canRequestRoom: boolean;
  latestRequest?: {
    REQUEST_ID: number;
    STATUS: string;
    ASSIGNED_ROOM_NO?: string | null;
    REMARKS?: string | null;
    REQUESTED_AT?: string | null;
    REVIEWED_AT?: string | null;
  } | null;
};

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  isOpen: boolean;
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [profile, setProfile] = useState<ProfileSnapshot>({ roomNo: "" });
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [nearbyStays, setNearbyStays] = useState<NearbyStay[]>([]);
  const [dashboardLoaded, setDashboardLoaded] = useState(false);
  const [roomAllocation, setRoomAllocation] = useState<RoomAllocationStatus>({
    hasAssignedRoom: false,
    totalVacancy: 0,
    hasPendingRequest: false,
    canRequestRoom: false,
    latestRequest: null,
  });
  const [roomRequestFeedback, setRoomRequestFeedback] = useState<{message: string, type: "success" | "error"} | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getStoredToken();
    const role = getStoredRole();
    if (!token || role !== "Student") {
      navigate("/");
    } else {
      setIsAuthChecking(false);
    }
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      const [leavesRes, profileRes, attendanceRes, feesRes, menuRes, staysRes, roomAllocationRes] = await Promise.allSettled([
        api.get("/leave/my-leaves"),
        api.get("/student/profile"),
        api.get("/student/attendance"),
        api.get("/student/fees"),
        api.get("/student/canteen-menu"),
        api.get("/student/nearby-stays"),
        api.get("/student/room-allocation-status"),
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
      setRoomAllocation(
        roomAllocationRes.status === "fulfilled"
          ? {
              hasAssignedRoom: Boolean(roomAllocationRes.value.data?.hasAssignedRoom),
              roomNo: roomAllocationRes.value.data?.roomNo || null,
              totalVacancy: Number(roomAllocationRes.value.data?.totalVacancy || 0),
              hasPendingRequest: Boolean(roomAllocationRes.value.data?.hasPendingRequest),
              canRequestRoom: Boolean(roomAllocationRes.value.data?.canRequestRoom),
              latestRequest: roomAllocationRes.value.data?.latestRequest || null,
            }
          : {
              hasAssignedRoom: false,
              totalVacancy: 0,
              hasPendingRequest: false,
              canRequestRoom: false,
              latestRequest: null,
            }
      );

      const userId = profileRes.status === "fulfilled" ? profileRes.value.data?.profile?.USER_ID : null;
      if (userId) {
        socket.connect();
        socket.emit("join", userId);
      }
    } catch (err) {
      // Keep dashboard lightweight
    } finally {
      setDashboardLoaded(true);
    }
  };

  useEffect(() => {
    if (isAuthChecking) return;
    loadDashboardData();
    const pollingWindow = window.setInterval(loadDashboardData, 30000);

    socket.on("leaveStatusChanged", (data: any) => {
      toast.success(`Your leave request was reviewed: status is ${data.status}! Remarks: ${data.remarks || 'None'}`);
      loadDashboardData();
    });

    return () => {
      window.clearInterval(pollingWindow);
      socket.off("leaveStatusChanged");
      socket.disconnect();
    };
  }, [isAuthChecking]);

  const hasAssignedRoom = dashboardLoaded && Boolean(profile.roomNo || roomAllocation.roomNo || roomAllocation.hasAssignedRoom);

  useEffect(() => {
    if (!hasAssignedRoom && (activeTab === "leave" || activeTab === "attendance" || activeTab === "fees" || activeTab === "feedback")) {
      setActiveTab("dashboard");
    }
  }, [activeTab, hasAssignedRoom]);

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

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-emerald-700">Verifying access...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    api.post("/auth/logout").catch(() => undefined).finally(() => {
      clearAuthSession();
      navigate("/");
    });
  };

  const handleRoomRequest = async () => {
    try {
      await api.post("/student/room-allocation-requests");
      setRoomAllocation((prev) => ({
        ...prev,
        hasPendingRequest: true,
        canRequestRoom: false,
      }));
      setRoomRequestFeedback({ message: "Room request submitted successfully", type: "success" });
    } catch (err: any) {
      setRoomRequestFeedback({ message: err.response?.data?.message || "Failed to submit room request", type: "error" });
    }
    setTimeout(() => setRoomRequestFeedback(null), 5000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        if (!dashboardLoaded) {
          return (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-emerald-50 p-4 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-emerald-100 h-24 sm:h-28"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-slate-50 p-6 rounded-2xl shadow-sm border border-slate-100 h-64"></div>
                 <div className="bg-slate-50 p-6 rounded-2xl shadow-sm border border-slate-100 h-64"></div>
              </div>
            </div>
          );
        }

        if (!hasAssignedRoom) {
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-200">
                  <h3 className="text-slate-500 text-sm font-medium">Room Status</h3>
                  <p className="text-3xl font-bold text-amber-700 mt-2">Not Allocated</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
                  <h3 className="text-slate-500 text-sm font-medium">Current Hostel Vacancy</h3>
                  <p className="text-3xl font-bold text-emerald-700 mt-2">{roomAllocation.totalVacancy}</p>
                </div>
                <button
                  onClick={() => setActiveTab("canteen")}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 text-left hover:border-emerald-300"
                >
                  <h3 className="text-slate-500 text-sm font-medium">Today&apos;s Meals</h3>
                  <p className="text-3xl font-bold text-emerald-700 mt-2">{menuStats.available}</p>
                  <p className="text-xs text-slate-500 mt-2">Available items today</p>
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-200">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Hostel Room Request</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      You will get access to hostel services after a room is assigned. If vacancy opens, you can request hostel allocation here.
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    {roomAllocation.hasPendingRequest ? (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        Request Pending
                      </span>
                    ) : roomAllocation.canRequestRoom ? (
                      <button
                        onClick={handleRoomRequest}
                        className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
                      >
                        Apply For Hostel Room
                      </button>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        No vacancy available right now
                      </span>
                    )}
                    {roomRequestFeedback && (
                      <p className={`text-xs mt-2 font-medium ${roomRequestFeedback.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                        {roomRequestFeedback.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

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
                  Until a room is allotted, you can use these nearby options shared by technical staff. New hostel vacancies will appear here automatically.
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
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-emerald-100">
                <h3 className="text-slate-500 text-xs sm:text-sm font-medium truncate">Total Leaves</h3>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-700 mt-2">{leaveStats.total}</p>
              </div>
              <div className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-emerald-100">
                <h3 className="text-slate-500 text-xs sm:text-sm font-medium truncate">Pending Approvals</h3>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-500 mt-2">{leaveStats.pending}</p>
              </div>
              <div className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-emerald-100">
                <h3 className="text-slate-500 text-xs sm:text-sm font-medium truncate">Approved Leaves</h3>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-500 mt-2">{leaveStats.approved}</p>
              </div>
              <div className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-emerald-100">
                <h3 className="text-slate-500 text-xs sm:text-sm font-medium truncate">Room Number</h3>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-600 mt-2">{profile.roomNo || "N/A"}</p>
              </div>
            </div>

            {!hasAssignedRoom && (
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
    hasAssignedRoom && activeTab === "leave" ? (
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
    <div className={`min-h-screen ${theme.bg} flex flex-col md:flex-row`}>
      {/* Mobile Top Navbar */}
      <header className="md:hidden flex h-16 items-center justify-between px-6 text-white z-20 shadow-md w-full shrink-0" style={{ backgroundColor: theme.color }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-lg">
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold tracking-wide">Student Portal</h1>
        </div>
        <div className="text-xs text-white/80 font-medium">{getStoredIdentifier() || "STUDENT"}</div>
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
              <h1 className="text-xl font-bold tracking-wide truncate">Student Portal</h1>
              <p className="text-xs text-white/80 truncate">{getStoredIdentifier() || "STUDENT"}</p>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center bg-white/15">
              <GraduationCap className="h-5 w-5 text-white" />
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
            icon={<LayoutDashboard className="w-5 h-5 shrink-0" />}
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => { setActiveTab("dashboard"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            isOpen={isSidebarOpen}
            theme={theme}
          />
          {hasAssignedRoom && (
            <>
              <SidebarItem
                icon={<FileText className="w-5 h-5 shrink-0" />}
                label="Leave Management"
                active={activeTab === "leave"}
                onClick={() => {
                  setLeaveInitialTab("list");
                  setActiveTab("leave");
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                isOpen={isSidebarOpen}
                theme={theme}
              />
              <SidebarItem
                icon={<CalendarCheck className="w-5 h-5 shrink-0" />}
                label="Attendance"
                active={activeTab === "attendance"}
                onClick={() => { setActiveTab("attendance"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                isOpen={isSidebarOpen}
                theme={theme}
              />
              <SidebarItem
                icon={<CreditCard className="w-5 h-5 shrink-0" />}
                label="Fees"
                active={activeTab === "fees"}
                onClick={() => { setActiveTab("fees"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                isOpen={isSidebarOpen}
                theme={theme}
              />
              <SidebarItem
                icon={<MessageSquare className="w-5 h-5 shrink-0" />}
                label="Feedback"
                active={activeTab === "feedback"}
                onClick={() => { setActiveTab("feedback"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                isOpen={isSidebarOpen}
                theme={theme}
              />
            </>
          )}
          <SidebarItem
            icon={<Coffee className="w-5 h-5 shrink-0" />}
            label="Canteen Menu"
            active={activeTab === "canteen"}
            onClick={() => { setActiveTab("canteen"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            isOpen={isSidebarOpen}
            theme={theme}
          />
          <SidebarItem
            icon={<User className="w-5 h-5 shrink-0" />}
            label="Profile"
            active={activeTab === "profile"}
            onClick={() => { setActiveTab("profile"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            isOpen={isSidebarOpen}
            theme={theme}
          />
        </nav>

        <div className="p-4 border-t border-white/20">
          <button
            onClick={handleLogout}
            className={`flex items-center w-full p-3 bg-white text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shadow-sm ${!isSidebarOpen && 'justify-center'}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="ml-3 font-medium truncate">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 transition-all duration-300 min-h-[101vh] overflow-x-hidden">
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
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-none">
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

function SidebarItem({ icon, label, active, onClick, isOpen, theme }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center p-3 rounded-xl transition-colors font-medium ${
        active ? "text-white" : "text-white/80 hover:bg-white/5"
      } ${!isOpen && "justify-center"}`}
      style={active ? { backgroundColor: theme.activeColor } : undefined}
    >
      {icon}
      {isOpen && <span className="ml-3 truncate">{label}</span>}
    </button>
  );
}
          
