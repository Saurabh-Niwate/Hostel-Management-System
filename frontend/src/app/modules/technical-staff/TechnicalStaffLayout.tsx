import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { clearAuthSession } from '../../lib/authStorage';

interface NavItem {
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/technical-staff/dashboard' },
  { label: 'Manage Users', path: '/technical-staff/users' },
  { label: 'Students', path: '/technical-staff/students' },
  { label: 'Staff', path: '/technical-staff/staff' },
  { label: 'Roles', path: '/technical-staff/roles' },
  { label: 'Create User', path: '/technical-staff/create' },
  { label: 'Settings', path: '/technical-staff/settings' },
];

export function TechnicalStaffLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearAuthSession();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-slate-200 transition-all duration-300 overflow-hidden`}>
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900">Hostel Portal</h1>
          <p className="text-sm text-slate-500">Management System</p>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 border-l-4 border-teal-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden mb-2 px-3 py-1 bg-slate-100 rounded text-sm"
          >
            Menu
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Clerk Dashboard</h2>
              <div className="h-1 w-20 bg-teal-600 mt-1 rounded-full"></div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">Admin User</p>
              <p className="text-xs text-slate-500">Clerk Role</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
