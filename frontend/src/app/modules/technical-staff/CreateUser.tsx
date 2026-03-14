import { useState } from "react";
import { UserPlus, Users, Briefcase } from "lucide-react";

interface CreateUserProps {
  onUserCreated?: () => void;
}

export function CreateUser({ onUserCreated }: CreateUserProps) {
  const [userType, setUserType] = useState<"student" | "staff">("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [studentForm, setStudentForm] = useState({
    studentId: "",
    fullName: "",
    phone: "",
    guardianName: "",
    guardianPhone: "",
    address: "",
    roomNo: "",
    email: "",
    password: "",
  });
  const [staffForm, setStaffForm] = useState({
    employeeId: "",
    email: "",
    password: "",
    roleName: "Warden",
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !studentForm.studentId.trim() ||
      !studentForm.password.trim() ||
      !studentForm.fullName.trim() ||
      !studentForm.phone.trim() ||
      !studentForm.guardianName.trim() ||
      !studentForm.guardianPhone.trim() ||
      !studentForm.address.trim() ||
      !studentForm.roomNo.trim()
    ) {
      setError("All student fields are required except email");
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSuccess("Student created successfully (Demo Mode)");
      setStudentForm({
        studentId: "",
        fullName: "",
        phone: "",
        guardianName: "",
        guardianPhone: "",
        address: "",
        roomNo: "",
        email: "",
        password: "",
      });
      setLoading(false);
      onUserCreated?.();
    }, 1000);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!staffForm.employeeId.trim() || !staffForm.password.trim() || !staffForm.roleName.trim()) {
      setError("Employee ID, role and password are required");
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSuccess("Staff created successfully (Demo Mode)");
      setStaffForm({ employeeId: "", email: "", password: "", roleName: "Warden" });
      setLoading(false);
      onUserCreated?.();
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-teal-100 rounded-lg">
          <UserPlus className="w-6 h-6 text-teal-700" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Create New User</h2>
          <p className="text-slate-600 text-sm">Add students or staff members to the system</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setUserType("student");
              setError("");
              setSuccess("");
            }}
            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium transition-all ${userType === "student" ? "bg-teal-600 text-white shadow-md" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
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
            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium transition-all ${userType === "staff" ? "bg-teal-600 text-white shadow-md" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
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
              value={studentForm.guardianName}
              onChange={(e) => setStudentForm({ ...studentForm, guardianName: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
              placeholder="Guardian Name (required)"
              disabled={loading}
              required
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
            <input
              type="text"
              value={studentForm.roomNo}
              onChange={(e) => setStudentForm({ ...studentForm, roomNo: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
              placeholder="Hostel Room Number (required)"
              disabled={loading}
              required
            />
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
              className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
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
              className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? "Creating Staff..." : "Create Staff"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

