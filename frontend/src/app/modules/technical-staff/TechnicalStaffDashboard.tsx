import { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Users as UsersIcon, LogOut, Menu, X, ShieldCheck, Wallet, BedDouble } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";
import { CreateUser } from './CreateUser';
import { ManageUsers } from './ManageUsers';
import { FeeManagement } from './FeeManagement';
import { RoomManagement } from './RoomManagement';
import { StaffProfileSettings } from '../../components/StaffProfileSettings';
import { api } from '../../lib/api';

type View = 'dashboard' | 'create-users' | 'manage-users' | 'room-management' | 'fee-management' | 'profile';
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
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
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
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userIdentifier');
      navigate('/');
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
          : currentView === 'profile'
            ? 'Profile'
          : 'Fee Management';

  const viewDescription =
    currentView === 'dashboard'
      ? 'User operations, fee handling, and system activity from one control panel.'
      : currentView === 'create-users'
        ? 'Add new students or staff members with the required hostel details.'
        : currentView === 'manage-users'
          ? 'Search, view, edit, and remove users from the system.'
          : currentView === 'room-management'
            ? 'Create, edit, activate, or remove hostel rooms.'
          : currentView === 'profile'
            ? 'View your account details and update your password.'
          : 'Create and update student fee records with current status.';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <motion.aside
        initial={{ width: 280 }}
        animate={{ width: 280 }}
        className={`fixed top-0 left-0 h-full w-[280px] bg-cyan-900 border-r border-cyan-800 z-30 text-white flex flex-col transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-cyan-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-cyan-300" />
                <div>
                  <h1 className="text-xl font-bold tracking-wide">Technical Portal</h1>
                  <p className="text-xs text-cyan-200">{localStorage.getItem('userIdentifier') || 'TECHNICAL'}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-cyan-800 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${isActive
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/40'
                      : 'text-cyan-100 hover:bg-cyan-800 hover:text-white'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-cyan-800/50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-200 hover:bg-red-900/30 rounded-xl font-medium transition-colors"
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

      <main className="flex-1 p-8 ml-0 lg:ml-[280px] transition-all duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-start gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-sm"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-3xl font-bold text-slate-900">{viewTitle}</h2>
              <p className="text-slate-500 mt-1">{viewDescription}</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Total Users</p>
                      <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                    </div>
                    <div className="p-3 bg-teal-100 rounded-lg">
                      <UsersIcon className="w-6 h-6 text-teal-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Students</p>
                      <p className="text-3xl font-bold text-slate-900">{stats.students}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <UsersIcon className="w-6 h-6 text-blue-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Staff Members</p>
                      <p className="text-3xl font-bold text-slate-900">{stats.staff}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <UsersIcon className="w-6 h-6 text-purple-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Rooms</p>
                      <p className="text-3xl font-bold text-slate-900">{stats.rooms}</p>
                    </div>
                    <div className="p-3 bg-cyan-100 rounded-lg">
                      <BedDouble className="w-6 h-6 text-cyan-700" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setCurrentView('create-users')}
                    className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <UserPlus className="w-5 h-5 text-teal-700" />
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
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <UsersIcon className="w-5 h-5 text-blue-700" />
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

          {currentView === 'fee-management' && <FeeManagement />}

          {currentView === 'profile' && <StaffProfileSettings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
