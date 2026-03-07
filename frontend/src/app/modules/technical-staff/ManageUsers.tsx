import { useMemo, useState } from "react";
import { Users, Trash2, Search } from "lucide-react";

interface ManageUsersProps {
  refreshTrigger?: number;
}

type UserRow = {
  USER_ID: number;
  STUDENT_ID?: string;
  EMP_ID?: string;
  EMAIL?: string;
  ROLE_NAME: string;
};

type RoleRow = {
  ROLE_ID: number;
  ROLE_NAME: string;
};

type UserDetailsResponse = {
  user: UserRow;
  studentProfile?: {
    FULL_NAME?: string;
    PHONE?: string;
    GUARDIAN_NAME?: string;
    GUARDIAN_PHONE?: string;
    ADDRESS?: string;
    ROOM_NO?: string;
    PROFILE_IMAGE_URL?: string;
  } | null;
};

const DUMMY_USERS: UserRow[] = [
  { USER_ID: 1, STUDENT_ID: "STU001", EMAIL: "saurabh@example.com", ROLE_NAME: "Student" },
  { USER_ID: 2, EMP_ID: "EMP001", EMAIL: "warden@example.com", ROLE_NAME: "Warden" },
  { USER_ID: 3, STUDENT_ID: "STU002", EMAIL: "amit@example.com", ROLE_NAME: "Student" },
  { USER_ID: 4, EMP_ID: "EMP002", EMAIL: "security@example.com", ROLE_NAME: "Security" },
];

const DUMMY_ROLES: RoleRow[] = [
  { ROLE_ID: 1, ROLE_NAME: "Student" },
  { ROLE_ID: 2, ROLE_NAME: "Warden" },
  { ROLE_ID: 3, ROLE_NAME: "Security" },
  { ROLE_ID: 4, ROLE_NAME: "Admin" },
  { ROLE_ID: 5, ROLE_NAME: "Technical Staff" },
];

const getDummyUserDetails = (userId: number): UserDetailsResponse => {
  const user = DUMMY_USERS.find(u => u.USER_ID === userId) || DUMMY_USERS[0];
  return {
    user,
    studentProfile: user.ROLE_NAME === "Student" ? {
      FULL_NAME: user.STUDENT_ID === "STU001" ? "Saurabh Niwate" : "Amit Shah",
      PHONE: "9876543210",
      GUARDIAN_NAME: "Sunil Niwate",
      GUARDIAN_PHONE: "9123456789",
      ADDRESS: "123, Hostel Block A",
      ROOM_NO: user.STUDENT_ID === "STU001" ? "A-101" : "A-102",
    } : null
  };
};

export function ManageUsers({ refreshTrigger }: ManageUsersProps) {
  const [users, setUsers] = useState<UserRow[]>(DUMMY_USERS);
  const [roles] = useState<RoleRow[]>(DUMMY_ROLES);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedDetails, setSelectedDetails] = useState<UserDetailsResponse | null>(null);
  const [roleTarget, setRoleTarget] = useState<UserRow | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<UserRow | null>(null);
  const [editStudentTarget, setEditStudentTarget] = useState<UserDetailsResponse | null>(null);
  const [updatingStudent, setUpdatingStudent] = useState(false);
  const [editStudentForm, setEditStudentForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    guardianName: "",
    guardianPhone: "",
    address: "",
    roomNo: "",
  });
  const [newRole, setNewRole] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      (u.STUDENT_ID || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.EMP_ID || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.EMAIL || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.ROLE_NAME.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const handleDelete = (userId: number) => {
    if (!confirm("Are you sure you want to delete this user? (Demo Mode)")) return;
    setUsers(prev => prev.filter(u => u.USER_ID !== userId));
    setSuccess("User deleted successfully (Demo Mode)");
  };

  const getIdentifier = (u: UserRow) => u.STUDENT_ID || u.EMP_ID || "-";

  const handleViewDetails = (u: UserRow) => {
    setSuccess("");
    setRoleTarget(null);
    setPasswordTarget(null);
    setEditStudentTarget(null);
    setSelectedDetails(getDummyUserDetails(u.USER_ID));
  };

  const openRolePanel = (u: UserRow) => {
    setSelectedDetails(null);
    setPasswordTarget(null);
    setEditStudentTarget(null);
    setRoleTarget(u);
    setNewRole(u.ROLE_NAME || "");
    setSuccess("");
  };

  const openPasswordPanel = (u: UserRow) => {
    setSelectedDetails(null);
    setRoleTarget(null);
    setEditStudentTarget(null);
    setPasswordTarget(u);
    setNewPassword("");
    setSuccess("");
  };

  const handleRoleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTarget || !newRole.trim()) return;
    setUsers(prev => prev.map(u => u.USER_ID === roleTarget.USER_ID ? { ...u, ROLE_NAME: newRole } : u));
    setSuccess(`Role updated to ${newRole} for ${getIdentifier(roleTarget)} (Demo)`);
    setRoleTarget(null);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget || !newPassword.trim()) return;
    setSuccess(`Password reset for ${getIdentifier(passwordTarget)} (Demo)`);
    setPasswordTarget(null);
    setNewPassword("");
  };

  const openEditStudentFromDetails = () => {
    if (!selectedDetails || selectedDetails.user.ROLE_NAME !== "Student") return;
    setEditStudentTarget(selectedDetails);
    setEditStudentForm({
      email: selectedDetails.user.EMAIL || "",
      fullName: selectedDetails.studentProfile?.FULL_NAME || "",
      phone: selectedDetails.studentProfile?.PHONE || "",
      guardianName: selectedDetails.studentProfile?.GUARDIAN_NAME || "",
      guardianPhone: selectedDetails.studentProfile?.GUARDIAN_PHONE || "",
      address: selectedDetails.studentProfile?.ADDRESS || "",
      roomNo: selectedDetails.studentProfile?.ROOM_NO || "",
    });
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudentTarget?.user.STUDENT_ID) return;
    setUpdatingStudent(true);
    setTimeout(() => {
      setSuccess(`Student updated: ${editStudentTarget.user.STUDENT_ID} (Demo)`);
      setEditStudentTarget(null);
      setUpdatingStudent(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-teal-100 rounded-lg">
          <Users className="w-6 h-6 text-teal-700" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Manage Users</h2>
          <p className="text-slate-600 text-sm">View and manage users in the system</p>
        </div>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student ID / emp ID / email / role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">ID</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Email</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Role</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Loading users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No users found</td></tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.USER_ID} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900">{u.STUDENT_ID || u.EMP_ID || `USER-${u.USER_ID}`}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.EMAIL || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{u.ROLE_NAME}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => handleViewDetails(u)} className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700 hover:bg-slate-200">View</button>
                        <button onClick={() => openPasswordPanel(u)} className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700 hover:bg-amber-200">Reset Password</button>
                        <button onClick={() => openRolePanel(u)} className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200">Role</button>
                        <button
                          onClick={() => handleDelete(u.USER_ID)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDetails && (
        <ModalShell title="User Details" onClose={() => setSelectedDetails(null)}>
          {selectedDetails.user.ROLE_NAME === "Student" && (
            <div className="mb-4">
              <button
                onClick={openEditStudentFromDetails}
                className="px-3 py-1.5 text-sm rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              >
                Edit Student
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <p><span className="font-semibold">Identifier:</span> {getIdentifier(selectedDetails.user)}</p>
            <p><span className="font-semibold">Email:</span> {selectedDetails.user.EMAIL || "-"}</p>
            <p><span className="font-semibold">Role:</span> {selectedDetails.user.ROLE_NAME}</p>
            <p><span className="font-semibold">User ID (internal):</span> {selectedDetails.user.USER_ID}</p>
            {selectedDetails.user.ROLE_NAME === "Student" && (
              <>
                <p><span className="font-semibold">Full Name:</span> {selectedDetails.studentProfile?.FULL_NAME || "-"}</p>
                <p><span className="font-semibold">Phone:</span> {selectedDetails.studentProfile?.PHONE || "-"}</p>
                <p><span className="font-semibold">Guardian Name:</span> {selectedDetails.studentProfile?.GUARDIAN_NAME || "-"}</p>
                <p><span className="font-semibold">Guardian Phone:</span> {selectedDetails.studentProfile?.GUARDIAN_PHONE || "-"}</p>
                <p className="md:col-span-2"><span className="font-semibold">Address:</span> {selectedDetails.studentProfile?.ADDRESS || "-"}</p>
                <p><span className="font-semibold">Room No:</span> {selectedDetails.studentProfile?.ROOM_NO || "-"}</p>
              </>
            )}
          </div>
        </ModalShell>
      )}

      {passwordTarget && (
        <ModalShell title="Reset Password" onClose={() => setPasswordTarget(null)}>
          <form onSubmit={handlePasswordReset} className="space-y-3">
            <input value={getIdentifier(passwordTarget)} readOnly className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50" />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              required
            />
            <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Reset Password</button>
          </form>
        </ModalShell>
      )}

      {roleTarget && (
        <ModalShell title="Change Role" onClose={() => setRoleTarget(null)}>
          <form onSubmit={handleRoleUpdate} className="space-y-3">
            <input value={getIdentifier(roleTarget)} readOnly className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50" />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              {roles.map((r) => (
                <option key={r.ROLE_ID} value={r.ROLE_NAME}>{r.ROLE_NAME}</option>
              ))}
            </select>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Role</button>
          </form>
        </ModalShell>
      )}

      {editStudentTarget && (
        <ModalShell title="Edit Student Profile" onClose={() => setEditStudentTarget(null)}>
          <form onSubmit={handleUpdateStudent} className="space-y-3">
            <input value={editStudentTarget.user.STUDENT_ID || ""} readOnly className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50" />
            <input value={editStudentForm.email} onChange={(e) => setEditStudentForm({ ...editStudentForm, email: e.target.value })} placeholder="Email" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <input value={editStudentForm.fullName} onChange={(e) => setEditStudentForm({ ...editStudentForm, fullName: e.target.value })} placeholder="Full Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <input value={editStudentForm.phone} onChange={(e) => setEditStudentForm({ ...editStudentForm, phone: e.target.value })} placeholder="Phone" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <input value={editStudentForm.guardianName} onChange={(e) => setEditStudentForm({ ...editStudentForm, guardianName: e.target.value })} placeholder="Guardian Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <input value={editStudentForm.guardianPhone} onChange={(e) => setEditStudentForm({ ...editStudentForm, guardianPhone: e.target.value })} placeholder="Guardian Phone" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <input value={editStudentForm.roomNo} onChange={(e) => setEditStudentForm({ ...editStudentForm, roomNo: e.target.value })} placeholder="Room No" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <textarea value={editStudentForm.address} onChange={(e) => setEditStudentForm({ ...editStudentForm, address: e.target.value })} placeholder="Address" className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={3} />
            <button type="submit" disabled={updatingStudent} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {updatingStudent ? "Updating..." : "Update Student"}
            </button>
          </form>
        </ModalShell>
      )}
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl border border-slate-200 max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="px-3 py-1 text-sm bg-slate-100 rounded-lg hover:bg-slate-200">Close</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

