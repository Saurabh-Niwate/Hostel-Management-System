import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./components/LoginPage";

import { StudentDashboard } from "./modules/student/StudentDashboard";
import { TechnicalStaffDashboard } from "./modules/technical-staff/TechnicalStaffDashboard";
import { AdminDashboard } from "./modules/admin/AdminDashboard";
import { SecurityDashboard } from "./modules/security/SecurityDashboard";
import {
  CanteenLayout,
  CanteenDashboard,
  MenuManagement,
  MenuVoting,
  FoodAvailability,
  ProfileSettings,
} from "./modules/canteen";
function WardenDashboard() {
  return <h1>Warden Dashboard</h1>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/technical-staff-dashboard" element={< TechnicalStaffDashboard />} />
      <Route path="/warden-dashboard" element={<WardenDashboard />} />
      <Route path="/security-dashboard" element={<SecurityDashboard />} />
      <Route path="/canteen" element={<CanteenLayout />}>
        <Route index element={<CanteenDashboard />} />
        <Route path="menu" element={<MenuManagement />} />
        <Route path="voting" element={<MenuVoting />} />
        <Route path="inventory" element={<FoodAvailability />} />
        <Route path="settings" element={<ProfileSettings />} />
      </Route>
    </Routes>
  );
}
