import { useState } from 'react';
import { Users, BedDouble, ClipboardCheck, FileText, Settings, LogOut, Menu, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { mockDashboardMetrics } from './mockData';
import { RoomsManagement } from './RoomsManagement';
import { StudentsManagement } from './StudentsManagement';
import { AttendanceManagement } from './AttendanceManagement';
import { LeaveRequests } from './LeaveRequests';

type TabType = 'overview' | 'rooms' | 'students' | 'attendance' | 'leaves' | 'settings';

export function WardenDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'overview' as TabType, label: 'Overview', icon: Users },
    { id: 'rooms' as TabType, label: 'Rooms', icon: BedDouble },
    { id: 'students' as TabType, label: 'Students', icon: Users },
    { id: 'attendance' as TabType, label: 'Attendance', icon: ClipboardCheck },
    { id: 'leaves' as TabType, label: 'Leave Requests', icon: FileText },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Warden Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">Dr. Rajesh Kumar</p>
                <p className="text-xs text-gray-500">Warden</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:block mt-[73px] lg:mt-0`}
        >
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
                    activeTab === item.id
                      ? 'bg-teal-50 text-teal-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'rooms' && <RoomsManagement />}
          {activeTab === 'students' && <StudentsManagement />}
          {activeTab === 'attendance' && <AttendanceManagement />}
          {activeTab === 'leaves' && <LeaveRequests />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

function OverviewTab() {
  const metrics = mockDashboardMetrics;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">Hostel management at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Rooms</CardDescription>
            <CardTitle className="text-3xl">{metrics.totalRooms}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">Across all blocks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-3xl">{metrics.totalStudents}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">Currently residing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Attendance Today</CardDescription>
            <CardTitle className="text-3xl">{metrics.attendanceMarkedToday}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">Out of {metrics.totalStudents} students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Leaves</CardDescription>
            <CardTitle className="text-3xl">{metrics.pendingRooms}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for hostel management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Mark Attendance
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              View Leave Requests
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BedDouble className="h-4 w-4 mr-2" />
              View Room Allocations
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              View Student Details
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest updates and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-teal-500 mt-2" />
                <div>
                  <p className="text-sm font-medium">Attendance marked for 178 students</p>
                  <p className="text-xs text-gray-500">Today at 9:30 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                <div>
                  <p className="text-sm font-medium">Leave request approved for Amit Kumar</p>
                  <p className="text-xs text-gray-500">Today at 8:15 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-amber-500 mt-2" />
                <div>
                  <p className="text-sm font-medium">Room 302 maintenance completed</p>
                  <p className="text-xs text-gray-500">Yesterday at 4:30 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-gray-400 mt-2" />
                <div>
                  <p className="text-sm font-medium">New student registered in Room 104</p>
                  <p className="text-xs text-gray-500">Yesterday at 2:00 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-500 mt-1">Manage your preferences and account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              defaultValue="Dr. Rajesh Kumar"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              defaultValue="rajesh.kumar@college.edu"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
            <input
              type="tel"
              defaultValue="+91 98765 00000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <Button className="bg-teal-600 hover:bg-teal-700">Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <Button className="bg-teal-600 hover:bg-teal-700">Update Password</Button>
        </CardContent>
      </Card>
    </div>
  );
}