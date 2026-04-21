import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./components/LoginPage";

const StudentDashboard = React.lazy(() => import("./modules/student/StudentDashboard").then(m => ({ default: m.StudentDashboard })));
const TechnicalStaffDashboard = React.lazy(() => import("./modules/technical-staff/TechnicalStaffDashboard").then(m => ({ default: m.TechnicalStaffDashboard })));
const AdminDashboard = React.lazy(() => import("./modules/admin/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const SecurityDashboard = React.lazy(() => import("./modules/security/SecurityDashboard").then(m => ({ default: m.SecurityDashboard })));
const WardenDashboard = React.lazy(() => import("./modules/warden/WardenDashboard").then(m => ({ default: m.WardenDashboard })));
const CanteenDashboard = React.lazy(() => import("./modules/canteen/CanteenDashboard").then(m => ({ default: m.CanteenDashboard })));

export default function App() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>}>
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
    </Suspense>
  );
}
