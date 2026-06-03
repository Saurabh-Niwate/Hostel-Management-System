-- PostgreSQL Database Schema for Hostel Management System

-- Drop tables if they exist (for easy re-running/seeding)
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS dinner_poll_votes CASCADE;
DROP TABLE IF EXISTS dinner_poll_options CASCADE;
DROP TABLE IF EXISTS dinner_polls CASCADE;
DROP TABLE IF EXISTS revoked_tokens CASCADE;
DROP TABLE IF EXISTS room_allocation_requests CASCADE;
DROP TABLE IF EXISTS canteen_menu CASCADE;
DROP TABLE IF EXISTS student_feedback CASCADE;
DROP TABLE IF EXISTS student_fees CASCADE;
DROP TABLE IF EXISTS entry_exit_logs CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS external_accommodations CASCADE;
DROP TABLE IF EXISTS staff_profiles CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- 1. Roles table
CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL
);

-- 2. Users table
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  student_id VARCHAR(20),
  emp_id VARCHAR(20),
  email VARCHAR(100),
  password VARCHAR(255) NOT NULL,
  token_version INTEGER DEFAULT 0 NOT NULL,
  role_id INTEGER,
  CONSTRAINT uq_users_student_id UNIQUE (student_id),
  CONSTRAINT uq_users_emp_id UNIQUE (emp_id),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE SET NULL
);

-- 3. Rooms table
CREATE TABLE rooms (
  room_no VARCHAR(20) PRIMARY KEY,
  block_name VARCHAR(50),
  floor_no SMALLINT,
  capacity SMALLINT DEFAULT 1 NOT NULL,
  room_type VARCHAR(30) DEFAULT 'Regular' NOT NULL,
  is_active SMALLINT DEFAULT 1 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT chk_rooms_capacity CHECK (capacity > 0),
  CONSTRAINT chk_rooms_active CHECK (is_active IN (0, 1))
);

-- 4. Students table
CREATE TABLE students (
  user_id INTEGER PRIMARY KEY,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  aadhar_no VARCHAR(20),
  guardian_name VARCHAR(100),
  guardian_email VARCHAR(100),
  guardian_phone VARCHAR(20),
  address VARCHAR(300),
  room_no VARCHAR(20),
  profile_image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_students_room FOREIGN KEY (room_no) REFERENCES rooms(room_no) ON DELETE SET NULL
);

-- 5. Staff Profiles table
CREATE TABLE staff_profiles (
  user_id INTEGER PRIMARY KEY,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  profile_image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_staff_profiles_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 6. External Accommodations table
CREATE TABLE external_accommodations (
  accommodation_id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  accommodation_type VARCHAR(30) NOT NULL,
  address VARCHAR(300) NOT NULL,
  distance_km NUMERIC(6,2),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  rent_min NUMERIC(10,2),
  rent_max NUMERIC(10,2),
  gender_allowed VARCHAR(20) DEFAULT 'Any' NOT NULL,
  availability_status VARCHAR(20) DEFAULT 'Available' NOT NULL,
  notes VARCHAR(500),
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_ext_acc_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT chk_ext_acc_type CHECK (accommodation_type IN ('PG', 'Dormitory', 'Apartment')),
  CONSTRAINT chk_ext_acc_gender CHECK (gender_allowed IN ('Male', 'Female', 'Any')),
  CONSTRAINT chk_ext_acc_status CHECK (availability_status IN ('Available', 'Limited', 'Full'))
);

-- 7. Leave Requests table
CREATE TABLE leave_requests (
  leave_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  leave_type VARCHAR(50) NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason VARCHAR(500) NOT NULL,
  status VARCHAR(20) DEFAULT 'Pending' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  reviewed_by INTEGER,
  reviewed_at TIMESTAMP,
  remarks VARCHAR(500),
  CONSTRAINT fk_leave_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT chk_leave_status CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  CONSTRAINT chk_leave_dates CHECK (from_date <= to_date)
);

-- 8. Attendance Records table
CREATE TABLE attendance_records (
  attendance_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  remarks VARCHAR(300),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_attendance_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT chk_attendance_status CHECK (status IN ('Present', 'Absent', 'Late'))
);

-- 9. Entry Exit Logs table
CREATE TABLE entry_exit_logs (
  log_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  exit_time TIMESTAMP NOT NULL,
  entry_time TIMESTAMP,
  status VARCHAR(10) DEFAULT 'OUT' NOT NULL,
  leave_id INTEGER,
  exit_remarks VARCHAR(300),
  entry_remarks VARCHAR(300),
  created_by INTEGER NOT NULL,
  updated_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_entry_exit_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_entry_exit_leave FOREIGN KEY (leave_id) REFERENCES leave_requests(leave_id) ON DELETE SET NULL,
  CONSTRAINT fk_entry_exit_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT fk_entry_exit_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT chk_entry_exit_status CHECK (status IN ('OUT', 'IN')),
  CONSTRAINT chk_entry_exit_time CHECK (entry_time IS NULL OR entry_time >= exit_time)
);

-- 10. Student Fees table
CREATE TABLE student_fees (
  fee_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  term_name VARCHAR(50) NOT NULL,
  amount_total NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) DEFAULT 0 NOT NULL,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'Pending' NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_fees_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT chk_fee_status CHECK (status IN ('Pending', 'Partially Paid', 'Paid', 'Overdue'))
);

-- 11. Student Feedback table
CREATE TABLE student_feedback (
  feedback_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  facility_area VARCHAR(100) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  rating SMALLINT,
  status VARCHAR(20) DEFAULT 'Open' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT chk_feedback_rating CHECK ((rating BETWEEN 1 AND 5) OR rating IS NULL),
  CONSTRAINT chk_feedback_status CHECK (status IN ('Open', 'In Review', 'Closed'))
);

-- 12. Canteen Menu table
CREATE TABLE canteen_menu (
  menu_id SERIAL PRIMARY KEY,
  menu_date DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL,
  item_name VARCHAR(200) NOT NULL,
  is_available SMALLINT DEFAULT 1 NOT NULL,
  created_by INTEGER,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_menu_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT chk_meal_type CHECK (meal_type IN ('Breakfast', 'Lunch', 'Snacks', 'Dinner')),
  CONSTRAINT chk_menu_available CHECK (is_available IN (0, 1))
);

-- 13. Room Allocation Requests table
CREATE TABLE room_allocation_requests (
  request_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'Pending' NOT NULL,
  assigned_room_no VARCHAR(20),
  remarks VARCHAR(500),
  reviewed_by INTEGER,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  reviewed_at TIMESTAMP,
  CONSTRAINT fk_room_req_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_room_req_room FOREIGN KEY (assigned_room_no) REFERENCES rooms(room_no) ON DELETE SET NULL,
  CONSTRAINT fk_room_req_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT chk_room_req_status CHECK (status IN ('Pending', 'Assigned', 'Rejected', 'Cancelled'))
);

-- 14. Revoked Tokens table
CREATE TABLE revoked_tokens (
  jti VARCHAR(80) PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_rev_tok_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 15. Dinner Polls table
CREATE TABLE dinner_polls (
  poll_id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  dinner_date DATE NOT NULL,
  closes_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'Open' NOT NULL,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  closed_at TIMESTAMP,
  CONSTRAINT fk_dinner_polls_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT chk_dinner_polls_status CHECK (status IN ('Open', 'Closed'))
);

-- 16. Dinner Poll Options table
CREATE TABLE dinner_poll_options (
  option_id SERIAL PRIMARY KEY,
  poll_id INTEGER NOT NULL,
  option_name VARCHAR(200) NOT NULL,
  description VARCHAR(500),
  display_order SMALLINT DEFAULT 1 NOT NULL,
  CONSTRAINT fk_dinner_poll_options_poll FOREIGN KEY (poll_id) REFERENCES dinner_polls(poll_id) ON DELETE CASCADE
);

-- 17. Dinner Poll Votes table
CREATE TABLE dinner_poll_votes (
  vote_id SERIAL PRIMARY KEY,
  poll_id INTEGER NOT NULL,
  option_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_dinner_poll_votes_poll FOREIGN KEY (poll_id) REFERENCES dinner_polls(poll_id) ON DELETE CASCADE,
  CONSTRAINT fk_dinner_poll_votes_option FOREIGN KEY (option_id) REFERENCES dinner_poll_options(option_id) ON DELETE CASCADE,
  CONSTRAINT fk_dinner_poll_votes_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT uq_dinner_poll_votes_user UNIQUE (poll_id, user_id)
);

-- 18. System Logs table
CREATE TABLE system_logs (
  log_id SERIAL PRIMARY KEY,
  actor_user_id INTEGER NOT NULL,
  actor_role VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  details VARCHAR(1000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_system_logs_actor FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
