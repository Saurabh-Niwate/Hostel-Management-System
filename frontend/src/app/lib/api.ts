import axios from "axios";
import MockAdapter from "axios-mock-adapter";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ------------- MOCK API RESPONSES -------------
const mock = new MockAdapter(api, { delayResponse: 500 });
console.log("Mock Adapter initialized for api.ts");

// Login Auth Mock
mock.onPost("/auth/login").reply((config) => {
  const { identifier, password } = JSON.parse(config.data);
  let role = "Student";
  if (identifier.includes("admin")) role = "Admin";
  else if (identifier.includes("staff")) role = "Technical Staff";
  else if (identifier.includes("warden")) role = "Warden";
  else if (identifier.includes("security")) role = "Security";
  else if (identifier.includes("canteen")) role = "Canteen Owner";

  return [
    200,
    {
      token: "dummy-jwt-token-for-dev",
      role: role,
      user: {
        id: "1",
        name: "Dummy User",
        email: identifier,
      },
    },
  ];
});

// Student Endpoints Mocks
mock.onGet("/student/profile").reply(200, {
  profile: { ROOM_NO: "A-101", NAME: "Student Name", COURSE: "B.Tech" },
});

mock.onGet("/leave/my-leaves").reply(200, {
  leaves: [
    { LEAVE_ID: 1, LEAVE_TYPE: "Sick", FROM_DATE: "2026-03-01", TO_DATE: "2026-03-03", STATUS: "Approved" },
    { LEAVE_ID: 2, LEAVE_TYPE: "Casual", FROM_DATE: "2026-03-10", TO_DATE: "2026-03-12", STATUS: "Pending" },
  ],
});

mock.onPost("/leave/apply").reply(200, { message: "Leave applied successfully." });

mock.onGet("/student/attendance").reply(200, {
  attendance: [
    { DATE: "2026-03-01", STATUS: "Present" },
    { DATE: "2026-03-02", STATUS: "Absent" },
    { DATE: "2026-03-03", STATUS: "Present" },
  ],
});

mock.onGet("/student/fees").reply(200, {
  fees: [
    { AMOUNT_DUE: 5000, STATUS: "Pending", DUE_DATE: "2026-04-01" },
    { AMOUNT_DUE: 15000, STATUS: "Paid", DUE_DATE: "2026-01-01" },
  ],
});

mock.onGet("/student/canteen-menu").reply(200, {
  menu: [
    { ITEM_NAME: "Thali", IS_AVAILABLE: 1 },
    { ITEM_NAME: "Sandwich", IS_AVAILABLE: 1 },
    { ITEM_NAME: "Juice", IS_AVAILABLE: 0 },
  ],
});

// Admin Endpoints Mocks
mock.onGet("/admin/reports-overview").reply(200, {
  overview: {
    totalStudents: 1200,
    totalStaff: 50,
    leavesPending: 12,
    feesCollected: 500000,
  },
});

mock.onGet("/admin/students").reply(200, {
  students: [
    { id: 1, name: "Student A", room: "A-101", course: "B.Tech" },
    { id: 2, name: "Student B", room: "A-102", course: "B.Tech" },
  ],
});

mock.onGet("/admin/leaves").reply(200, {
  leaves: [
    { id: 1, studentId: 1, studentName: "Student A", type: "Sick", status: "Pending", fromDate: "2026-03-10", toDate: "2026-03-12" },
  ],
});

mock.onPost(/\/admin\/leaves\/\d+\/approve/).reply(200, { message: "Status updated" });
mock.onPost(/\/admin\/leaves\/\d+\/reject/).reply(200, { message: "Status updated" });

mock.onGet("/admin/attendance-summary").reply(200, {
  summary: { averageAttendance: "85%", totalPresent: 1000, totalAbsent: 200 },
});

// Technical Staff Endpoints Mocks
mock.onGet("/tech-staff/dashboard").reply(200, {
  stats: { activeIssues: 5, resolvedIssues: 120 },
});
mock.onGet("/users").reply(200, [
  { id: 1, name: "Admin User", role: "Admin", email: "admin@hostel.com" },
  { id: 2, name: "Staff User", role: "Technical Staff", email: "staff@hostel.com" },
]);

// Any other GET
mock.onGet(/.*/).reply(200, { data: "Fallback mock data for GET" });
// Any other POST
mock.onPost(/.*/).reply(200, { data: "Fallback mock data for POST", message: "Success" });
// Any other PUT
mock.onPut(/.*/).reply(200, { data: "Fallback mock data for PUT", message: "Success" });
// Any other DELETE
mock.onDelete(/.*/).reply(200, { data: "Fallback mock data for DELETE", message: "Success" });

export default api;
