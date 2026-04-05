import { useEffect, useState } from "react";
import { Trash2, Search } from "lucide-react";
import { api } from "../../lib/api";

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
    AADHAR_NO?: string;
    GUARDIAN_NAME?: string;
    GUARDIAN_PHONE?: string;
    ADDRESS?: string;
    ROOM_NO?: string;
    PROFILE_IMAGE_URL?: string;
  } | null;
  staffProfile?: {
    FULL_NAME?: string;
    PHONE?: string;
    CREATED_AT?: string;
  } | null;
};

export function ManageUsers({ refreshTrigger }: ManageUsersProps) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedDetails, setSelectedDetails] = useState<UserDetailsResponse | null>(null);
  const [roleTarget, setRoleTarget] = useState<UserRow | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<UserRow | null>(null);
  const [editStudentTarget, setEditStudentTarget] = useState<UserDetailsResponse | null>(null);
  const [editStudentImageFile, setEditStudentImageFile] = useState<File | null>(null);
  const [updatingStudent, setUpdatingStudent] = useState(false);
  const [editStudentForm, setEditStudentForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    aadharNo: "",
    guardianName: "",
    guardianPhone: "",
    address: "",
    roomNo: "",
  });
  const [newRole, setNewRole] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const fetchUserDetails = async (userId: number) => {
    const res = await api.get(`/technical-staff/users/${userId}`);
    return res.data as UserDetailsResponse;
  };

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/technical-staff/users", {
        params: { q: searchQuery || undefined },
      });
      setUsers(response.data.users || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await api.get("/technical-staff/roles");
        const rows = res.data?.roles || [];
        setRoles(rows);
      } catch {
        setRoles([]);
      }
    };
    loadRoles();
  }, []);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await api.get("/technical-staff/rooms");
        setRooms(res.data?.rooms || []);
      } catch {
        setRooms([]);
      }
    };
    loadRooms();
  }, [refreshTrigger]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadUsers();
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchQuery, refreshTrigger]);

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user? This will use force delete.")) return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/technical-staff/users/${userId}`, {
        params: { force: true },
      });
      setSuccess("User deleted successfully (force)");
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  const getIdentifier = (u: UserRow) => u.STUDENT_ID || u.EMP_ID || "-";

  const handleViewDetails = async (u: UserRow) => {
    setError("");
    setSuccess("");
    setRoleTarget(null);
    setPasswordTarget(null);
    setEditStudentTarget(null);
    try {
      const data = await fetchUserDetails(u.USER_ID);
      setSelectedDetails(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch user details");
    }
  };

  const openRolePanel = (u: UserRow) => {
    setSelectedDetails(null);
    setPasswordTarget(null);
    setEditStudentTarget(null);
    setRoleTarget(u);
    setNewRole(u.ROLE_NAME || "");
    setError("");
    setSuccess("");
  };

  const openPasswordPanel = (u: UserRow) => {
    setSelectedDetails(null);
    setRoleTarget(null);
    setEditStudentTarget(null);
    setPasswordTarget(u);
    setNewPassword("");
    setError("");
    setSuccess("");
  };

  const handleRoleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTarget || !newRole.trim()) return;
    setError("");
    setSuccess("");
    try {
      await api.put(`/technical-staff/users/${roleTarget.USER_ID}/role`, {
        roleName: newRole.trim(),
      });
      setSuccess(`Role updated for ${getIdentifier(roleTarget)}`);
      setRoleTarget(null);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update role");
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget || !newPassword.trim()) return;
    setError("");
    setSuccess("");
    try {
      await api.put(`/technical-staff/users/${passwordTarget.USER_ID}/password`, {
        newPassword: newPassword.trim(),
      });
      setSuccess(`Password reset for ${getIdentifier(passwordTarget)}`);
      setPasswordTarget(null);
      setNewPassword("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password");
    }
  };

  const openEditStudentFromDetails = () => {
    if (!selectedDetails || selectedDetails.user.ROLE_NAME !== "Student") return;
    setEditStudentTarget(selectedDetails);
    setEditStudentForm({
      email: selectedDetails.user.EMAIL || "",
      fullName: selectedDetails.studentProfile?.FULL_NAME || "",
      phone: selectedDetails.studentProfile?.PHONE || "",
      aadharNo: selectedDetails.studentProfile?.AADHAR_NO || "",
      guardianName: selectedDetails.studentProfile?.GUARDIAN_NAME || "",
      guardianPhone: selectedDetails.studentProfile?.GUARDIAN_PHONE || "",
      address: selectedDetails.studentProfile?.ADDRESS || "",
      roomNo: selectedDetails.studentProfile?.ROOM_NO || "",
    });
    setEditStudentImageFile(null);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudentTarget?.user.STUDENT_ID) return;
    setError("");
    setSuccess("");
    setUpdatingStudent(true);
    try {
      await api.put(`/technical-staff/students/${editStudentTarget.user.STUDENT_ID}`, {
        email: editStudentForm.email.trim() || null,
        fullName: editStudentForm.fullName.trim() || null,
        phone: editStudentForm.phone.trim() || null,
        aadharNo: editStudentForm.aadharNo.trim() || null,
        guardianName: editStudentForm.guardianName.trim() || null,
        guardianPhone: editStudentForm.guardianPhone.trim() || null,
        address: editStudentForm.address.trim() || null,
        roomNo: editStudentForm.roomNo.trim() || null,
      });

      if (editStudentImageFile) {
        const formData = new FormData();
        formData.append("image", editStudentImageFile);
        await api.post(
          `/technical-staff/students/${editStudentTarget.user.STUDENT_ID}/profile-image`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      const freshDetails = await fetchUserDetails(editStudentTarget.user.USER_ID);
      setSelectedDetails(freshDetails);
      setSuccess(`Student updated: ${editStudentTarget.user.STUDENT_ID}`);
      setEditStudentTarget(null);
      setEditStudentImageFile(null);
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update student");
    } finally {
      setUpdatingStudent(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student ID / emp ID / email / role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No users found</td></tr>
              ) : (
                users.map((u) => (
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
          {selectedDetails.user.ROLE_NAME === "Student" && (
            <div className="mb-4 flex items-center gap-3">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                {selectedDetails.studentProfile?.PROFILE_IMAGE_URL ? (
                  <img
                    src={selectedDetails.studentProfile.PROFILE_IMAGE_URL}
                    alt="Student profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs">No Photo</span>
                )}
              </div>
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
                <p><span className="font-semibold">Aadhar Number:</span> {selectedDetails.studentProfile?.AADHAR_NO || "-"}</p>
                <p><span className="font-semibold">Guardian Name:</span> {selectedDetails.studentProfile?.GUARDIAN_NAME || "-"}</p>
                <p><span className="font-semibold">Guardian Phone:</span> {selectedDetails.studentProfile?.GUARDIAN_PHONE || "-"}</p>
                <p className="md:col-span-2"><span className="font-semibold">Address:</span> {selectedDetails.studentProfile?.ADDRESS || "-"}</p>
                <p><span className="font-semibold">Room No:</span> {selectedDetails.studentProfile?.ROOM_NO || "-"}</p>
              </>
            )}
            {selectedDetails.user.ROLE_NAME !== "Student" && (
              <>
                <p><span className="font-semibold">Full Name:</span> {selectedDetails.staffProfile?.FULL_NAME || "-"}</p>
                <p><span className="font-semibold">Phone:</span> {selectedDetails.staffProfile?.PHONE || "-"}</p>
                <p><span className="font-semibold">Employee ID:</span> {selectedDetails.user.EMP_ID || "-"}</p>
                <p><span className="font-semibold">Profile Created:</span> {selectedDetails.staffProfile?.CREATED_AT || "-"}</p>
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
            <input value={editStudentForm.aadharNo} onChange={(e) => setEditStudentForm({ ...editStudentForm, aadharNo: e.target.value })} placeholder="Aadhar Number" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <input value={editStudentForm.guardianName} onChange={(e) => setEditStudentForm({ ...editStudentForm, guardianName: e.target.value })} placeholder="Guardian Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <input value={editStudentForm.guardianPhone} onChange={(e) => setEditStudentForm({ ...editStudentForm, guardianPhone: e.target.value })} placeholder="Guardian Phone" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <select
              value={editStudentForm.roomNo}
              onChange={(e) => setEditStudentForm({ ...editStudentForm, roomNo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Select room</option>
              {rooms
                .filter((room) => Number(room.IS_ACTIVE) === 1 && (Number(room.VACANCY || 0) > 0 || room.ROOM_NO === editStudentForm.roomNo))
                .map((room) => (
                  <option key={room.ROOM_NO} value={room.ROOM_NO}>
                    {room.ROOM_NO} | Block {room.BLOCK_NAME || "-"} | Vacant: {room.VACANCY}
                  </option>
                ))}
            </select>
            <textarea value={editStudentForm.address} onChange={(e) => setEditStudentForm({ ...editStudentForm, address: e.target.value })} placeholder="Address" className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={3} />
            <div>
              <label className="block text-sm text-slate-600 mb-1">Profile Photo (optional)</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setEditStudentImageFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
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
