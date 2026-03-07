import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Users as UsersIcon, LogOut, Menu, X } from 'lucide-react';
import { CreateUser } from './CreateUser';
import { ManageUsers } from './ManageUsers';
import { FeeManagement } from './FeeManagement';

type View = 'dashboard' | 'create-users' | 'manage-users' | 'fee-management';
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

const DUMMY_STATS = {
  total: 120,
  students: 100,
  staff: 20,
};

const DUMMY_LOGS: LogRow[] = [
  { LOG_ID: 1, ACTOR_USER_ID: 1, ACTOR_ROLE: "Staff", ACTION: "User Created", DETAILS: "Created student STU100", CREATED_AT: "2026-03-07 10:00:00" },
  { LOG_ID: 2, ACTOR_USER_ID: 2, ACTOR_ROLE: "Admin", ACTION: "Fee Updated", DETAILS: "Updated fee for Semester 1", CREATED_AT: "2026-03-07 11:30:00" },
  { LOG_ID: 3, ACTOR_USER_ID: 1, ACTOR_ROLE: "Staff", ACTION: "Room Assigned", DETAILS: "Assigned Room A-101 to STU100", CREATED_AT: "2026-03-07 12:15:00" },
];

export function TechnicalStaffDashboard() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats] = useState(DUMMY_STATS);
  const [logs] = useState<LogRow[]>(DUMMY_LOGS);

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
    { id: 'fee-management' as View, label: 'Fee Management', icon: UsersIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Hostel Portal</h1>
                <p className="text-sm text-slate-600">Technical Staff</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Menu className="w-6 h-6 text-slate-700" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {currentView === 'dashboard' && 'Dashboard Overview'}
                    {currentView === 'create-users' && 'Create New User'}
                    {currentView === 'manage-users' && 'Manage Users'}
                    {currentView === 'fee-management' && 'Fee Management'}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {currentView === 'dashboard' && 'Welcome to your dashboard'}
                    {currentView === 'create-users' && 'Add students or staff to the system'}
                    {currentView === 'manage-users' && 'View and manage all users'}
                    {currentView === 'fee-management' && 'Create and update student fee records'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
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

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
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

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
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
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setCurrentView('create-users')}
                    className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left"
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
                    className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <UsersIcon className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Manage Users</p>
                      <p className="text-sm text-slate-600">View, edit, and delete users</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
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

          {currentView === 'fee-management' && <FeeManagement />}
        </main>
      </div>
    </div>
  );
}

