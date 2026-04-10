import { useEffect, useMemo, useState } from "react";
import { Users, Briefcase } from "lucide-react";
import { api } from "../../lib/api";

interface CreateUserProps {
  onUserCreated?: () => void;
}

export function CreateUser({ onUserCreated }: CreateUserProps) {
  const [userType, setUserType] = useState<"student" | "staff">("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rooms, setRooms] = useState<any[]>([]);

  const [studentForm, setStudentForm] = useState({
    studentId: "",
    fullName: "",
    phone: "",
    aadharNo: "",
    guardianName: "",
    guardianEmail: "",
    guardianPhone: "",
    address: "",
    roomNo: "",
    email: "",
    password: "",
  });
  const [studentImageFile, setStudentImageFile] = useState<File | null>(null);

  const [staffForm, setStaffForm] = useState({
    employeeId: "",
    fullName: "",
    phone: "",
    email: "",
    password: "",
    roleName: "Warden",
  });

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
  }, []);

  const availableRooms = useMemo(
    () =>
      rooms.filter(
        (room) => Number(room.IS_ACTIVE) === 1 && Number(room.VACANCY || 0) > 0
      ),
    [rooms]
  );

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !studentForm.studentId.trim() ||
      !studentForm.password.trim() ||
      !studentForm.fullName.trim() ||
      !studentForm.phone.trim() ||
      !studentForm.aadharNo.trim() ||
      !studentForm.guardianName.trim() ||
      !studentForm.guardianPhone.trim() ||
      !studentForm.address.trim() ||
      !studentForm.roomNo.trim()
    ) {
      setError("All student fields are required except email");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("studentId", studentForm.studentId.trim());
      formData.append("fullName", studentForm.fullName.trim());
      formData.append("phone", studentForm.phone.trim());
      formData.append("aadharNo", studentForm.aadharNo.trim());
      formData.append("guardianName", studentForm.guardianName.trim());
      if (studentForm.guardianEmail.trim()) {
        formData.append("guardianEmail", studentForm.guardianEmail.trim());
      }
      formData.append("guardianPhone", studentForm.guardianPhone.trim());
      formData.append("address", studentForm.address.trim());
      formData.append("roomNo", studentForm.roomNo.trim());
      formData.append("password", studentForm.password);
      if (studentForm.email.trim()) {
        formData.append("email", studentForm.email.trim());
      }
      if (studentImageFile) {
        formData.append("image", studentImageFile);
      }

      await api.post("/technical-staff/create-student", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Student created successfully");
      setStudentForm({
        studentId: "",
        fullName: "",
        phone: "",
        aadharNo: "",
        guardianName: "",
        guardianEmail: "",
        guardianPhone: "",
        address: "",
        roomNo: "",
        email: "",
        password: "",
      });
      setStudentImageFile(null);
      onUserCreated?.();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create student");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!staffForm.employeeId.trim() || !staffForm.password.trim() || !staffForm.roleName.trim()) {
      setError("Employee ID, role and password are required");
      return;
    }

    setLoading(true);
    try {
      await api.post("/technical-staff/create-staff", {
        empId: staffForm.employeeId.trim(),
        fullName: staffForm.fullName.trim() || null,
        phone: staffForm.phone.trim() || null,
        email: staffForm.email.trim() || null,
        password: staffForm.password,
        roleName: staffForm.roleName.trim(),
      });
      setSuccess("Staff created successfully");
      setStaffForm({ employeeId: "", fullName: "", phone: "", email: "", password: "", roleName: "Warden" });
      onUserCreated?.();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setUserType("student");
              setError("");
              setSuccess("");
            }}
            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium transition-all ${
              userType === "student" ? "bg-cyan-600 text-white shadow-md" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Create Student</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setUserType("staff");
              setError("");
              setSuccess("");
            }}
            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium transition-all ${
              userType === "staff" ? "bg-cyan-600 text-white shadow-md" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span>Create Staff</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{success}</div>}

        {userType === "student" ? (
          <form onSubmit={handleCreateStudent} className="space-y-4 max-w-2xl">
            <input
              type="text"
              value={studentForm.studentId}
              onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
              placeholder="Student ID (required)"
              disabled={loading}
              required
            />
            <input
              type="text"
              value={studentForm.fullName}
              onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
              placeholder="Full Name (required)"
              disabled={loading}
              required
            />
            <input
              type="text"
              value={studentForm.phone}
              onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
              placeholder="Student Phone (required)"
              disabled={loading}
              required
            />
            <input
              type="text"
              value={studentForm.aadharNo}
              onChange={(e) => setStudentForm({ ...studentForm, aadharNo: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
              placeholder="Aadhar Number (required)"
              disabled={loading}
              required
            />
            <input
              type="text"
              value={studentForm.guardianName}
              onChange={(e) => setStudentForm({ ...studentForm, guardianName: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
              placeholder="Guardian Name (required)"
              disabled={loading}
              required
            />
            <input
              type="email"
              value={studentForm.guardianEmail}
              onChange={(e) => setStudentForm({ ...studentForm, guardianEmail: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
              placeholder="Guardian Email (optional)"
              disabled={loading}
            />
            <input
              type="text"
              value={studentForm.guardianPhone}
              onChange={(e) => setStudentForm({ ...studentForm, guardianPhone: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
              placeholder="Guardian Phone (required)"
              disabled={loading}
              required
            />
            <select
              value={studentForm.roomNo}
              onChange={(e) => setStudentForm({ ...studentForm, roomNo: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white"
              disabled={loading}
              required
            >
              <option value="">Select hostel room (required)</option>
              {availableRooms.map((room) => (
                <option key={room.ROOM_NO} value={room.ROOM_NO}>
                  {room.ROOM_NO} | Block {room.BLOCK_NAME || "-"} | Vacant: {room.VACANCY}
                </option>
              ))}
            </select>
            <textarea
              value={studentForm.address}
              onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
              placeholder="Home Address (required)"
              disabled={loading}
              rows={3}
              required
            />
            <input
              type="email"
              value={studentForm.email}
              onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
              placeholder="Email (optional)"
              disabled={loading}
            />
            <div>
              <label className="block text-sm text-slate-600 mb-1">Profile Photo (optional)</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setStudentImageFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white"
                disabled={loading}
              />
            </div>
            <input
              type="password"
              value={studentForm.password}
              onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
              placeholder="Password (required)"
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50"
            >
              {loading ? "Creating Student..." : "Create Student"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateStaff} className="space-y-4 max-w-2xl">
            <input
              type="text"
              value={staffForm.employeeId}
              onChange={(e) => setStaffForm({ ...staffForm, employeeId: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
              placeholder="Employee ID (required)"
              disabled={loading}
            />
            <input
              type="text"
              value={staffForm.fullName}
              onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
              placeholder="Full Name (optional)"
              disabled={loading}
            />
            <input
              type="text"
              value={staffForm.phone}
              onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
              placeholder="Phone Number (optional)"
              disabled={loading}
            />
            <input
              type="email"
              value={staffForm.email}
              onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
              placeholder="Email (optional)"
              disabled={loading}
            />
            <select
              value={staffForm.roleName}
              onChange={(e) => setStaffForm({ ...staffForm, roleName: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white"
              disabled={loading}
            >
              <option>Warden</option>
              <option>Security</option>
              <option>Canteen Owner</option>
              <option>Admin</option>
              <option>Technical Staff</option>
            </select>
            <input
              type="password"
              value={staffForm.password}
              onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
              placeholder="Password (required)"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50"
            >
              {loading ? "Creating Staff..." : "Create Staff"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
