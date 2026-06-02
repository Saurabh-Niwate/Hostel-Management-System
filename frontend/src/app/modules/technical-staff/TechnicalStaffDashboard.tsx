import { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Users as UsersIcon, LogOut, Menu, X, ShieldCheck, Wallet, BedDouble, Plus, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";
import { CreateUser } from './CreateUser';
import { ManageUsers } from './ManageUsers';
import { FeeManagement } from './FeeManagement';
import { RoomManagement } from './RoomManagement';
import { NearbyStayManagement } from './NearbyStayManagement';
import { StaffProfileSettings } from '../../components/StaffProfileSettings';
import { api } from '../../lib/api';
import { clearAuthSession, getStoredIdentifier, getStoredRole, getStoredToken } from '../../lib/authStorage';

type View = 'dashboard' | 'create-users' | 'manage-users' | 'room-management' | 'nearby-stays' | 'fee-management' | 'profile';
type LogRow = {
  LOG_ID: number;
  ACTOR_USER_ID: number;
  ACTOR_ROLE: string;
  ACTION: string;
  ENTITY_TYPE?: string;
  ENTITY_ID?: number;
  DETAILS?: string;
  CREATED_AT: string;
};

export function TechnicalStaffDashboard() {
  const theme = {
    color: "#0e7490",
    activeColor: "#0891b2",
    bg: "bg-cyan-50",
    text: "text-white",
    muted: "text-white/80",
  };
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    staff: 0,
    rooms: 0,
  });
  const [logs, setLogs] = useState<LogRow[]>([]);

  // Load stats
  useEffect(() => {
    const token = getStoredToken();
    const role = getStoredRole();
    if (!token || role !== 'Technical Staff') {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [studentsRes, staffRes, roomsRes, logsRes] = await Promise.all([
          api.get('/technical-staff/students'),
          api.get('/technical-staff/staff'),
          api.get('/technical-staff/rooms'),
          api.get('/technical-staff/system-logs', { params: { limit: 8 } }),
        ]);

        const students = studentsRes.data?.students || [];
        const staff = staffRes.data?.staff || [];
        const rooms = roomsRes.data?.rooms || [];
        setStats({
          students: students.length,
          staff: staff.length,
          total: students.length + staff.length,
          rooms: rooms.length,
        });
        setLogs(logsRes.data?.logs || []);
      } catch {
        setStats({ total: 0, students: 0, staff: 0, rooms: 0 });
        setLogs([]);
      }
    };
    loadStats();
  }, [refreshTrigger]);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      api.post('/auth/logout').catch(() => undefined).finally(() => {
        clearAuthSession();
        navigate('/');
      });
    }
  };

  const handleUserCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const navigationItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-users' as View, label: 'Create Users', icon: UserPlus },
    { id: 'manage-users' as View, label: 'Manage Users', icon: UsersIcon },
    { id: 'room-management' as View, label: 'Room Management', icon: BedDouble },
    { id: 'nearby-stays' as View, label: 'Nearby Stays', icon: MapPin },
    { id: 'fee-management' as View, label: 'Fee Management', icon: Wallet },
    { id: 'profile' as View, label: 'Profile', icon: UsersIcon },
  ];

  const viewTitle =
    currentView === 'dashboard'
      ? 'Technical Staff Dashboard'
      : currentView === 'create-users'
        ? 'Create Users'
        : currentView === 'manage-users'
          ? 'Manage Users'
          : currentView === 'room-management'
            ? 'Room Management'
          : currentView === 'nearby-stays'
            ? 'Nearby Stay Suggestions'
          : currentView === 'profile'
            ? 'Profile'
          : 'Fee Management';

  const headerAction =
    currentView === 'fee-management' ? (
      <button
        onClick={() => window.dispatchEvent(new Event('technical-staff:create-fee-record'))}
        className="flex items-center px-4 py-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-all font-medium"
      >
        <Plus size={18} className="mr-2" />
        Create New Fee Record
      </button>
    ) : currentView === 'room-management' ? (
      <button
        onClick={() => window.dispatchEvent(new Event('technical-staff:create-room'))}
        className="flex items-center px-4 py-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-all font-medium"
      >
        <Plus size={18} className="mr-2" />
        Create Room
      </button>
    ) : currentView === 'nearby-stays' ? (
      <button
        onClick={() => window.dispatchEvent(new Event('technical-staff:create-nearby-stay'))}
        className="flex items-center px-4 py-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-all font-medium"
      >
        <Plus size={18} className="mr-2" />
        Add Nearby Stay
      </button>
    ) : null;

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col md:flex-row`}>
      {/* Mobile Top Navbar */}
      <header className="md:hidden flex h-16 items-center justify-between px-6 text-white z-20 shadow-md w-full shrink-0" style={{ backgroundColor: theme.color }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-lg">
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold tracking-wide">Technical Portal</h1>
        </div>
        <div className="text-xs text-white/80 font-medium">{getStoredIdentifier() || "TECHNICAL"}</div>
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
              <h1 className="text-xl font-bold tracking-wide truncate">Technical Portal</h1>
              <p className="text-xs text-white/80 truncate">{getStoredIdentifier() || "TECHNICAL"}</p>
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
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center p-3 rounded-xl transition-colors font-medium ${
                  isActive ? "text-white" : "text-white/80 hover:bg-white/5"
                } ${!isSidebarOpen && "justify-center"}`}
                style={isActive ? { backgroundColor: theme.activeColor } : undefined}
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
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-[60vh]"
            >
              <div className="mb-6 flex items-center justify-between gap-4 min-h-[44px]">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-none">{viewTitle}</h2>
                  </div>
                </div>
                {headerAction && <div className="shrink-0 flex items-center">{headerAction}</div>}
              </div>

              {currentView === 'dashboard' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-slate-600 mb-1 truncate">Total Users</p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">{stats.total}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-cyan-100 rounded-lg shrink-0">
                      <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-slate-600 mb-1 truncate">Students</p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">{stats.students}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-cyan-100 rounded-lg shrink-0">
                      <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-slate-600 mb-1 truncate">Staff</p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">{stats.staff}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-cyan-100 rounded-lg shrink-0">
                      <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-slate-600 mb-1 truncate">Rooms</p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">{stats.rooms}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-cyan-100 rounded-lg shrink-0">
                      <BedDouble className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-700" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setCurrentView('create-users')}
                    className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <UserPlus className="w-5 h-5 text-cyan-700" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Create New User</p>
                      <p className="text-sm text-slate-600">Add students or staff</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setCurrentView('manage-users')}
                    className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <UsersIcon className="w-5 h-5 text-cyan-700" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Manage Users</p>
                      <p className="text-sm text-slate-600">View, edit, and delete users</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setCurrentView('room-management')}
                    className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <BedDouble className="w-5 h-5 text-cyan-700" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Manage Rooms</p>
                      <p className="text-sm text-slate-600">Create, edit, and delete rooms</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setCurrentView('nearby-stays')}
                    className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-cyan-700" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Nearby Stay Suggestions</p>
                      <p className="text-sm text-slate-600">Manage PG, dormitory, and apartment fallbacks</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900">Recent System Logs</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Time</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Action</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Actor</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-6 text-sm text-slate-500 text-center">
                            No logs available
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => (
                          <tr key={log.LOG_ID} className="hover:bg-slate-50">
                            <td className="px-6 py-3 text-sm text-slate-600">{log.CREATED_AT}</td>
                            <td className="px-6 py-3 text-sm font-medium text-slate-900">{log.ACTION}</td>
                            <td className="px-6 py-3 text-sm text-slate-600">{log.ACTOR_ROLE} (#{log.ACTOR_USER_ID})</td>
                            <td className="px-6 py-3 text-sm text-slate-600">{log.DETAILS || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentView === 'create-users' && <CreateUser onUserCreated={handleUserCreated} />}

          {currentView === 'manage-users' && <ManageUsers refreshTrigger={refreshTrigger} />}

          {currentView === 'room-management' && <RoomManagement />}

          {currentView === 'nearby-stays' && <NearbyStayManagement />}

          {currentView === 'fee-management' && <FeeManagement />}

          {currentView === 'profile' && <StaffProfileSettings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
