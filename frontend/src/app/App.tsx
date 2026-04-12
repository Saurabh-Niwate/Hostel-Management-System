import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./components/LoginPage";

import { StudentDashboard } from "./modules/student/StudentDashboard";
import { TechnicalStaffDashboard } from "./modules/technical-staff/TechnicalStaffDashboard";
import { AdminDashboard } from "./modules/admin/AdminDashboard";
import { SecurityDashboard } from "./modules/security/SecurityDashboard";
import { WardenDashboard } from "./modules/warden/WardenDashboard";
import { CanteenDashboard } from "./modules/canteen/CanteenDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route
        path="/technical-staff-dashboard"
        element={<TechnicalStaffDashboard />}
      />
      <Route path="/warden-dashboard" element={<WardenDashboard />} />
      <Route path="/security-dashboard" element={<SecurityDashboard />} />
      <Route path="/canteen-owner-dashboard" element={<CanteenDashboard />} />
    </Routes>
  );
}
