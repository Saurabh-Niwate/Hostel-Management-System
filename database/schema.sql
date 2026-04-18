

CREATE TABLE roles (
  role_id NUMBER PRIMARY KEY,
  role_name VARCHAR2(50) UNIQUE NOT NULL
);

CREATE SEQUENCE roles_seq
START WITH 1
INCREMENT BY 1;

CREATE OR REPLACE TRIGGER roles_trigger
BEFORE INSERT ON roles
FOR EACH ROW
BEGIN
  SELECT roles_seq.NEXTVAL
  INTO :NEW.role_id
  FROM dual;
END;
/



CREATE TABLE users (
  user_id NUMBER PRIMARY KEY,
  student_id VARCHAR2(20),
  emp_id VARCHAR2(20),
  email VARCHAR2(100),
  password VARCHAR2(255) NOT NULL,
  token_version NUMBER DEFAULT 0 NOT NULL,
  role_id NUMBER,
  CONSTRAINT uq_users_student_id UNIQUE (student_id),
  CONSTRAINT uq_users_emp_id UNIQUE (emp_id),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT fk_role FOREIGN KEY (role_id)
    REFERENCES roles(role_id)
);

CREATE SEQUENCE users_seq
START WITH 1
INCREMENT BY 1;

CREATE OR REPLACE TRIGGER users_trigger
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  SELECT users_seq.NEXTVAL
  INTO :NEW.user_id
  FROM dual;
END;
/


CREATE TABLE students (
  user_id NUMBER PRIMARY KEY,
  full_name VARCHAR2(100),
  phone VARCHAR2(20),
  aadhar_no VARCHAR2(20),
  guardian_name VARCHAR2(100),
  guardian_email VARCHAR2(100),
  guardian_phone VARCHAR2(20),
  address VARCHAR2(300),
  room_no VARCHAR2(20),
  profile_image_url VARCHAR2(500),
  created_at DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT fk_students_user FOREIGN KEY (user_id)
    REFERENCES users(user_id)
);

select * from students;

CREATE TABLE staff_profiles (
  user_id NUMBER PRIMARY KEY,
  full_name VARCHAR2(100),
  phone VARCHAR2(20),
  created_at DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT fk_staff_profiles_user FOREIGN KEY (user_id)
    REFERENCES users(user_id)
);

CREATE TABLE rooms (
  room_no VARCHAR2(20) PRIMARY KEY,
  block_name VARCHAR2(50),
  floor_no NUMBER(3),
  capacity NUMBER(3) DEFAULT 1 NOT NULL,
  room_type VARCHAR2(30) DEFAULT 'Regular' NOT NULL,
  is_active NUMBER(1) DEFAULT 1 NOT NULL,
  created_at DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT chk_rooms_capacity CHECK (capacity > 0),
  CONSTRAINT chk_rooms_active CHECK (is_active IN (0, 1))
);

CREATE TABLE external_accommodations (
  accommodation_id NUMBER PRIMARY KEY,
  name VARCHAR2(150) NOT NULL,
  accommodation_type VARCHAR2(30) NOT NULL,
  address VARCHAR2(300) NOT NULL,
  distance_km NUMBER(6,2),
  contact_phone VARCHAR2(20),
  contact_email VARCHAR2(100),
  rent_min NUMBER(10,2),
  rent_max NUMBER(10,2),
  gender_allowed VARCHAR2(20) DEFAULT 'Any' NOT NULL,
  availability_status VARCHAR2(20) DEFAULT 'Available' NOT NULL,
  notes VARCHAR2(500),
  created_by NUMBER,
  created_at DATE DEFAULT SYSDATE NOT NULL,
  updated_at DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT fk_ext_acc_creator FOREIGN KEY (created_by)
    REFERENCES users(user_id),
  CONSTRAINT chk_ext_acc_type CHECK (accommodation_type IN ('PG', 'Dormitory', 'Apartment')),
  CONSTRAINT chk_ext_acc_gender CHECK (gender_allowed IN ('Male', 'Female', 'Any')),
  CONSTRAINT chk_ext_acc_status CHECK (availability_status IN ('Available', 'Limited', 'Full'))
);

CREATE SEQUENCE external_accommodations_seq
START WITH 1
INCREMENT BY 1;

CREATE OR REPLACE TRIGGER ext_acc_trigger
BEFORE INSERT ON external_accommodations
FOR EACH ROW
BEGIN
  IF :NEW.accommodation_id IS NULL THEN
    SELECT external_accommodations_seq.NEXTVAL
    INTO :NEW.accommodation_id
    FROM dual;
  END IF;
END;
/

CREATE TABLE leave_requests (
  leave_id NUMBER PRIMARY KEY,
  user_id NUMBER NOT NULL,
  leave_type VARCHAR2(50) NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason VARCHAR2(500) NOT NULL,
  status VARCHAR2(20) DEFAULT 'Pending' NOT NULL,
  created_at DATE DEFAULT SYSDATE NOT NULL,
  reviewed_by NUMBER,
  reviewed_at DATE,
  remarks VARCHAR2(500),
  CONSTRAINT fk_leave_user FOREIGN KEY (user_id)
    REFERENCES users(user_id),
  CONSTRAINT fk_leave_reviewer FOREIGN KEY (reviewed_by)
    REFERENCES users(user_id),
  CONSTRAINT chk_leave_status CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  CONSTRAINT chk_leave_dates CHECK (from_date <= to_date)
);

CREATE SEQUENCE leave_requests_seq
START WITH 1
INCREMENT BY 1;

CREATE OR REPLACE TRIGGER leave_requests_trigger
BEFORE INSERT ON leave_requests
FOR EACH ROW
BEGIN
  IF :NEW.leave_id IS NULL THEN
    SELECT leave_requests_seq.NEXTVAL
    INTO :NEW.leave_id
    FROM dual;
  END IF;
END;
/

CREATE TABLE attendance_records (
  attendance_id NUMBER PRIMARY KEY,
  user_id NUMBER NOT NULL,
  attendance_date DATE NOT NULL,
  status VARCHAR2(20) NOT NULL,
  remarks VARCHAR2(300),
  created_at DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT fk_attendance_user FOREIGN KEY (user_id)
    REFERENCES users(user_id),
  CONSTRAINT chk_attendance_status CHECK (status IN ('Present', 'Absent', 'Late'))
);

CREATE SEQUENCE attendance_records_seq
START WITH 1
INCREMENT BY 1;

CREATE OR REPLACE TRIGGER attendance_records_trigger
BEFORE INSERT ON attendance_records
FOR EACH ROW
BEGIN
  IF :NEW.attendance_id IS NULL THEN
    SELECT attendance_records_seq.NEXTVAL
    INTO :NEW.attendance_id
    FROM dual;
  END IF;
END;
/

CREATE TABLE entry_exit_logs (
  log_id NUMBER PRIMARY KEY,
  user_id NUMBER NOT NULL,
  exit_time DATE NOT NULL,
  entry_time DATE,
  status VARCHAR2(10) DEFAULT 'OUT' NOT NULL,
  leave_id NUMBER,
  exit_remarks VARCHAR2(300),
  entry_remarks VARCHAR2(300),
  created_by NUMBER NOT NULL,
  updated_by NUMBER,
  created_at DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT fk_entry_exit_user FOREIGN KEY (user_id)
    REFERENCES users(user_id),
  CONSTRAINT fk_entry_exit_leave FOREIGN KEY (leave_id)
    REFERENCES leave_requests(leave_id),
  CONSTRAINT fk_entry_exit_created_by FOREIGN KEY (created_by)
    REFERENCES users(user_id),
  CONSTRAINT fk_entry_exit_updated_by FOREIGN KEY (updated_by)
    REFERENCES users(user_id),
  CONSTRAINT chk_entry_exit_status CHECK (status IN ('OUT', 'IN')),
  CONSTRAINT chk_entry_exit_time CHECK (entry_time IS NULL OR entry_time >= exit_time)
);

CREATE SEQUENCE entry_exit_logs_seq
START WITH 1
INCREMENT BY 1;

CREATE OR REPLACE TRIGGER entry_exit_logs_trigger
BEFORE INSERT ON entry_exit_logs
FOR EACH ROW
BEGIN
  IF :NEW.log_id IS NULL THEN
    SELECT entry_exit_logs_seq.NEXTVAL
    INTO :NEW.log_id
    FROM dual;
  END IF;
END;
/

CREATE TABLE student_fees (
  fee_id NUMBER PRIMARY KEY,
  user_id NUMBER NOT NULL,
  term_name VARCHAR2(50) NOT NULL,
  amount_total NUMBER(10,2) NOT NULL,
  amount_paid NUMBER(10,2) DEFAULT 0 NOT NULL,
  due_date DATE,
  status VARCHAR2(20) DEFAULT 'Pending' NOT NULL,
  updated_at DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT fk_fees_user FOREIGN KEY (user_id)
    REFERENCES users(user_id),
  CONSTRAINT chk_fee_status CHECK (status IN ('Pending', 'Partially Paid', 'Paid', 'Overdue'))
);

CREATE SEQUENCE student_fees_seq
START WITH 1
INCREMENT BY 1;

CREATE OR REPLACE TRIGGER student_fees_trigger
BEFORE INSERT ON student_fees
FOR EACH ROW
BEGIN
  IF :NEW.fee_id IS NULL THEN
    SELECT student_fees_seq.NEXTVAL
    INTO :NEW.fee_id
    FROM dual;
  END IF;
END;
/

CREATE TABLE student_feedback (
  feedback_id NUMBER PRIMARY KEY,
  user_id NUMBER NOT NULL,
  facility_area VARCHAR2(100) NOT NULL,
  message VARCHAR2(1000) NOT NULL,
  rating NUMBER(1),
  status VARCHAR2(20) DEFAULT 'Open' NOT NULL,
  created_at DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT fk_feedback_user FOREIGN KEY (user_id)
    REFERENCES users(user_id),
  CONSTRAINT chk_feedback_rating CHECK (rating BETWEEN 1 AND 5 OR rating IS NULL),
  CONSTRAINT chk_feedback_status CHECK (status IN ('Open', 'In Review', 'Closed'))
);

CREATE SEQUENCE student_feedback_seq
START WITH 1
INCREMENT BY 1;

CREATE OR REPLACE TRIGGER student_feedback_trigger
BEFORE INSERT ON student_feedback
FOR EACH ROW
BEGIN
  IF :NEW.feedback_id IS NULL THEN
    SELECT student_feedback_seq.NEXTVAL
    INTO :NEW.feedback_id
    FROM dual;
  END IF;
END;
/

CREATE TABLE canteen_menu (
  menu_id NUMBER PRIMARY KEY,
  menu_date DATE NOT NULL,
  meal_type VARCHAR2(20) NOT NULL,
  item_name VARCHAR2(200) NOT NULL,
  is_available NUMBER(1) DEFAULT 1 NOT NULL,
  created_by NUMBER,
  updated_at DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT fk_menu_creator FOREIGN KEY (created_by)
    REFERENCES users(user_id),
  CONSTRAINT chk_meal_type CHECK (meal_type IN ('Breakfast', 'Lunch', 'Snacks', 'Dinner')),
  CONSTRAINT chk_menu_available CHECK (is_available IN (0, 1))
);

CREATE SEQUENCE canteen_menu_seq
START WITH 1
INCREMENT BY 1;

CREATE OR REPLACE TRIGGER canteen_menu_trigger
BEFORE INSERT ON canteen_menu
FOR EACH ROW
BEGIN
  IF :NEW.menu_id IS NULL THEN
    SELECT canteen_menu_seq.NEXTVAL
    INTO :NEW.menu_id
    FROM dual;
  END IF;
END;
/

CREATE TABLE room_allocation_requests (
  request_id NUMBER PRIMARY KEY,
  user_id NUMBER NOT NULL,
  status VARCHAR2(20) DEFAULT 'Pending' NOT NULL,
  assigned_room_no VARCHAR2(20),
  remarks VARCHAR2(500),
  reviewed_by NUMBER,
  requested_at DATE DEFAULT SYSDATE NOT NULL,
  reviewed_at DATE,
  CONSTRAINT fk_room_req_user FOREIGN KEY (user_id)
    REFERENCES users(user_id),
  CONSTRAINT fk_room_req_room FOREIGN KEY (assigned_room_no)
    REFERENCES rooms(room_no),
  CONSTRAINT fk_room_req_reviewer FOREIGN KEY (reviewed_by)
    REFERENCES users(user_id),
  CONSTRAINT chk_room_req_status CHECK (status IN ('Pending', 'Assigned', 'Rejected', 'Cancelled'))
);

CREATE SEQUENCE room_allocation_requests_seq
START WITH 1
INCREMENT BY 1;

CREATE OR REPLACE TRIGGER room_alloc_req_trigger
BEFORE INSERT ON room_allocation_requests
FOR EACH ROW
BEGIN
  IF :NEW.request_id IS NULL THEN
    SELECT room_allocation_requests_seq.NEXTVAL
    INTO :NEW.request_id
    FROM dual;
  END IF;
END;
/

CREATE TABLE revoked_tokens (
  jti VARCHAR2(80) PRIMARY KEY,
  user_id NUMBER NOT NULL,
  expires_at DATE NOT NULL,
  created_at DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT fk_rev_tok_user FOREIGN KEY (user_id)
    REFERENCES users(user_id)
);

CREATE TABLE dinner_polls (
  poll_id NUMBER PRIMARY KEY,
  title VARCHAR2(200) NOT NULL,
  dinner_date DATE NOT NULL,
  closes_at DATE NOT NULL,
  status VARCHAR2(20) DEFAULT 'Open' NOT NULL,
  created_by NUMBER NOT NULL,
  created_at DATE DEFAULT SYSDATE NOT NULL,
  closed_at DATE,
  CONSTRAINT fk_dinner_polls_creator FOREIGN KEY (created_by)
    REFERENCES users(user_id),
  CONSTRAINT chk_dinner_polls_status CHECK (status IN ('Open', 'Closed'))
);

CREATE SEQUENCE dinner_polls_seq
START WITH 1
INCREMENT BY 1;

CREATE OR REPLACE TRIGGER dinner_polls_trigger
BEFORE INSERT ON dinner_polls
FOR EACH ROW
BEGIN
  IF :NEW.poll_id IS NULL THEN
    SELECT dinner_polls_seq.NEXTVAL
    INTO :NEW.poll_id
    FROM dual;
  END IF;
END;
/

CREATE TABLE dinner_poll_options (
  option_id NUMBER PRIMARY KEY,
  poll_id NUMBER NOT NULL,
  option_name VARCHAR2(200) NOT NULL,
  description VARCHAR2(500),
  display_order NUMBER(3) DEFAULT 1 NOT NULL,
  CONSTRAINT fk_dinner_poll_options_poll FOREIGN KEY (poll_id)
    REFERENCES dinner_polls(poll_id)
);

CREATE SEQUENCE dinner_poll_options_seq
START WITH 1
INCREMENT BY 1;

CREATE OR REPLACE TRIGGER dinner_poll_options_trigger
BEFORE INSERT ON dinner_poll_options
FOR EACH ROW
BEGIN
  IF :NEW.option_id IS NULL THEN
    SELECT dinner_poll_options_seq.NEXTVAL
    INTO :NEW.option_id
    FROM dual;
  END IF;
END;
/

CREATE TABLE dinner_poll_votes (
  vote_id NUMBER PRIMARY KEY,
  poll_id NUMBER NOT NULL,
  option_id NUMBER NOT NULL,
  user_id NUMBER NOT NULL,
  voted_at DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT fk_dinner_poll_votes_poll FOREIGN KEY (poll_id)
    REFERENCES dinner_polls(poll_id),
  CONSTRAINT fk_dinner_poll_votes_option FOREIGN KEY (option_id)
    REFERENCES dinner_poll_options(option_id),
  CONSTRAINT fk_dinner_poll_votes_user FOREIGN KEY (user_id)
    REFERENCES users(user_id),
  CONSTRAINT uq_dinner_poll_votes_user UNIQUE (poll_id, user_id)
);

CREATE SEQUENCE dinner_poll_votes_seq
START WITH 1
INCREMENT BY 1;

CREATE OR REPLACE TRIGGER dinner_poll_votes_trigger
BEFORE INSERT ON dinner_poll_votes
FOR EACH ROW
BEGIN
  IF :NEW.vote_id IS NULL THEN
    SELECT dinner_poll_votes_seq.NEXTVAL
    INTO :NEW.vote_id
    FROM dual;
  END IF;
END;
/

CREATE TABLE system_logs (
  log_id NUMBER PRIMARY KEY,
  actor_user_id NUMBER NOT NULL,
  actor_role VARCHAR2(50) NOT NULL,
  action VARCHAR2(100) NOT NULL,
  entity_type VARCHAR2(50),
  entity_id NUMBER,
  details VARCHAR2(1000),
  created_at DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT fk_system_logs_actor FOREIGN KEY (actor_user_id)
    REFERENCES users(user_id)
);

CREATE SEQUENCE system_logs_seq
START WITH 1
INCREMENT BY 1;

CREATE OR REPLACE TRIGGER system_logs_trigger
BEFORE INSERT ON system_logs
FOR EACH ROW
BEGIN
  IF :NEW.log_id IS NULL THEN
    SELECT system_logs_seq.NEXTVAL
    INTO :NEW.log_id
    FROM dual;
  END IF;
END;
/


COMMIT;




