# Hostel Management System - DFD Summary

## External Entities

- Student
- Admin
- Technical Staff
- Warden
- Security
- Canteen Owner

## Main Processes

- 1.0 Authentication
- 2.0 Student Self-Service
- 3.0 Leave Management
- 4.0 Admin Reporting and Review
- 5.0 Staff User and Fee Management
- 6.0 Warden Operations
- 7.0 Security Gate Control
- 8.0 Canteen Operations

## Main Data Stores

- D1 Users and Roles
- D2 Student Profiles
- D3 Leave Requests
- D4 Attendance Records
- D5 Fee Records
- D6 Feedback Records
- D7 Canteen Menu
- D8 System Logs
- D9 Profile Image Files
- D10 Rooms
- D11 Entry Exit Logs
- D12 Night Food Orders

## Implemented Role Security

- JWT token verification is implemented in `backend/src/middlewares/authMiddleware.js`.
- Role-based access is enforced with `requireRole(...)`.
- Mounted protected role routes in `backend/server.js` include:
  - `/api/student`
  - `/api/admin`
  - `/api/technical-staff`
  - `/api/warden`
  - `/api/security`
  - `/api/canteen-owner`

## Role Responsibilities

- Student: profile, attendance, fees, feedback, canteen menu, leave request.
- Admin: leave approval/rejection, reports, student details.
- Technical Staff: user creation, role management, fee management, system logs.
- Warden: room-wise attendance, room students, student basic details, leave status.
- Security: student exit/entry, today logs, outside-student tracking, gate status.
- Canteen Owner: daily menu management and night food order tracking/status updates.

## Diagram Pack

Use `DFD-drawio.drawio` for the editable diagrams. It now includes:

- Level 0 - Context
- Level 1 - Main Processes
- Level 2 - Student Self-Service
- Level 2 - Leave Management
- Level 2 - Admin Reporting and Review
- Level 2 - Technical Staff Management
- Level 2 - Warden Operations
- Level 2 - Security Gate Control
- Level 2 - Canteen Operations
