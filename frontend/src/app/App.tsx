import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./components/LoginPage";

import { StudentDashboard } from "./modules/student/StudentDashboard";

function AdminDashboard() {
  return <h1>Admin Dashboard</h1>;
}
function TechnicalStaffDashboard() {
  return <h1>Technical Staff Dashboard</h1>;
}

function WardenDashboard() {
  return <h1>Warden Dashboard</h1>;
}
function SecurityDashboard() {
  return <h1>Security Dashboard</h1>;
}
function CanteenOwnerDashboard() {
  return <h1>Canteen Owner Dashboard</h1>;
}


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/technical-staff-dashboard" element={<TechnicalStaffDashboard />} />
      <Route path="/warden-dashboard" element={<WardenDashboard />} />
      <Route path="/security-dashboard" element={<SecurityDashboard />} />
      <Route path="/canteen-owner-dashboard" element={<CanteenOwnerDashboard />} />
    </Routes>
  );
}