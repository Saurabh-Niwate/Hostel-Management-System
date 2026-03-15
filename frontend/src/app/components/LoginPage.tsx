import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Building2, Eye, EyeOff, Lock, Mail, IdCard } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";


type Role =
  | "admin"
  | "student"
  | "technicalStaff"
  | "warden"
  | "security"
  | "canteenOwner";

interface RoleOption {
  id: Role;
  label: string;
  color: string;
  bgColor: string;
  inputType: "email" | "studentId" | "employeeId";
}

const roles: RoleOption[] = [
  {
    id: "admin",
    label: "Admin",
    color: "#3b82f6",
    bgColor: "bg-blue-50",
    inputType: "email",
  },
  {
    id: "student",
    label: "Student",
    color: "#10b981",
    bgColor: "bg-emerald-50",
    inputType: "studentId",
  },
  {
    id: "technicalStaff",
    label: "Technical Staff",
    color: "#06b6d4",
    bgColor: "bg-cyan-50",
    inputType: "employeeId",
  },
  {
    id: "warden",
    label: "Warden",
    color: "#8b5cf6",
    bgColor: "bg-violet-50",
    inputType: "employeeId",
  },
  {
    id: "security",
    label: "Security",
    color: "#ef4444",
    bgColor: "bg-red-50",
    inputType: "employeeId",
  },
  {
    id: "canteenOwner",
    label: "Canteen Owner",
    color: "#f59e0b",
    bgColor: "bg-amber-50",
    inputType: "employeeId",
  },
];

export function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState(""); // email, student ID, or employee ID
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const selectedRoleData = roles.find((r) => r.id === selectedRole) || roles[1];

  const getInputLabel = () => {
    switch (selectedRoleData.inputType) {
      case "email":
        return "Email Address";
      case "studentId":
        return "Student ID";
      case "employeeId":
        return "Employee ID";
      default:
        return "ID";
    }
  };

  const getInputPlaceholder = () => {
    switch (selectedRoleData.inputType) {
      case "email":
        return "admin@hostel.com";
      case "studentId":
        return "Enter your Student ID / Email ID";
      case "employeeId":
        return "Enter your Employee ID";
      default:
        return "Enter your ID";
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const response = await api.post("/auth/login", {
        identifier,
        password,
      });
      const { token, role } = response.data;

      // Store JWT
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", role);
      localStorage.setItem("userIdentifier", identifier);

      if (selectedRoleData.label !== role) {
        setError("Selected role does not match your account role");
        return;
      }

      // Redirect based on role
      switch (role) {
        case "Admin":
          navigate("/admin-dashboard");
          break;
        case "Student":
          navigate("/student-dashboard");
          break;
        case "Technical Staff":
          navigate("/technical-staff-dashboard");
          break;
        case "Warden":
          navigate("/warden-dashboard");
          break;
        case "Security":
          navigate("/security-dashboard");
          break;
        case "Canteen Owner":
          navigate("/canteen-owner-dashboard");
          break;
        default:
          navigate("/");
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };


  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    // In a real app, this would open a modal or navigate to a password reset page
    alert("Password reset link will be sent to your registered contact.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-4">
      <div className="w-full max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left Side - Illustration */}
            <div className="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-blue-600 via-teal-500 to-cyan-600 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1680444873773-7c106c23ac52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjYW1wdXMlMjB1bml2ZXJzaXR5JTIwYnVpbGRpbmd8ZW58MXx8fHwxNzcwODI0MDcxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Campus"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="relative z-10 text-white text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="mb-8"
                >
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                    <Building2 className="w-12 h-12 text-white" />
                  </div>
                  <h1 className="text-5xl font-bold mb-3">Hostel Portal</h1>
                  <p className="text-2xl text-blue-100">Management System</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="mt-12 space-y-4"
                >
                  <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
                    <p className="text-lg mb-2">Secure Access for</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {roles.map((role, index) => (
                        <motion.div
                          key={role.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                          className="text-blue-100"
                        >
                          • {role.label}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              {/* Mobile Header */}
              <div className="md:hidden text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-500 rounded-full mb-4">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  Hostel Portal
                </h1>
                <p className="text-slate-600">Management System</p>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Welcome Back
                </h2>
                <p className="text-slate-600">
                  Sign in to continue to your dashboard
                </p>
              </div>

              {/* Role Selection Dropdown */}
              <div className="mb-6">
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Select Your Role
                </label>
                <div className="relative">
                  <select
                    id="role"
                    value={selectedRole}
                    onChange={(e) => {
                      setSelectedRole(e.target.value as Role);
                      setIdentifier("");
                      setPassword("");
                      setError("");
                    }}
                    className="w-full px-4 py-3 pr-10 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors appearance-none bg-white cursor-pointer"
                    style={{
                      borderColor: selectedRoleData.color,
                    }}
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* ID/Email Input */}
                <div>
                  <label
                    htmlFor="identifier"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    {getInputLabel()}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      {selectedRoleData.inputType === "email" ? (
                        <Mail className="w-5 h-5 text-slate-400" />
                      ) : (
                        <IdCard className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <input
                      id="identifier"
                      type={
                        selectedRoleData.inputType === "email"
                          ? "email"
                          : "text"
                      }
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={getInputPlaceholder()}
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none transition-colors"
                      style={{
                        borderColor: identifier
                          ? selectedRoleData.color
                          : undefined,
                      }}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-12 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:outline-none transition-colors"
                      style={{
                        borderColor: password
                          ? selectedRoleData.color
                          : undefined,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember"
                      type="checkbox"
                      className="w-4 h-4 border-slate-300 rounded focus:ring-2"
                      style={{
                        accentColor: selectedRoleData.color,
                      }}
                    />
                    <label
                      htmlFor="remember"
                      className="ml-2 text-sm text-slate-600"
                    >
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm font-medium hover:underline transition-colors"
                    style={{ color: selectedRoleData.color }}
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login Button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-3.5 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
                  style={{
                    backgroundColor: selectedRoleData.color,
                  }}
                >
                  Login as {selectedRoleData.label}
                </motion.button>
              </form>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                <p className="text-sm text-slate-500">
                  © 2026 Hostel Portal Management System
                </p>
                <button className="text-sm text-slate-600 hover:text-blue-600 mt-2 transition-colors">
                  Need help? Contact Support
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
