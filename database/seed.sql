INSERT INTO roles (role_name) VALUES ('Admin');
INSERT INTO roles (role_name) VALUES ('Student');
INSERT INTO roles (role_name) VALUES ('Technical Staff');
INSERT INTO roles (role_name) VALUES ('Warden');
INSERT INTO roles (role_name) VALUES ('Security');
INSERT INTO roles (role_name) VALUES ('Canteen Owner');

select * from roles;

INSERT INTO users (email, password, role_id) VALUES ('Admin@gmail.com', '$2b$10$OLYP0CjzE1ghZzwNHlKMsOJ2o2.hn3EAxERpmESX1tle0JTW6QCPm', 1);
INSERT INTO users (student_id, password, role_id) VALUES ('STU001', '$2b$10$Rx5aXkQGvk427RUSkKbVp.IMxUbkTQLp9cxeu7IZLw8ahjrbK08US', 2);
INSERT INTO users (emp_id, password, role_id) VALUES ('TES001', '$2b$10$fr1g93UKlCx/RmGuWsmt0esfHh11PUp2132QkKeKnxk/v4f7drZne', 3);
INSERT INTO users (emp_id, password, role_id) VALUES ('WAR001', '$2b$10$JpGvhCDmY7x6OPm3vGXA6uHqFxeJgYBdZj3EXNAnpOZfsA0UzilF6', 4);
INSERT INTO users (emp_id, password, role_id) VALUES ('SEC001', '$2b$10$5vD75.1TpTYfxyzJFxwiPOpdGzpEe8WGZE7yVxbBMWCM3/SyenJ8y', 5);
INSERT INTO users (emp_id, password, role_id) VALUES ('CAN001', '$2b$10$6l.Y1ydjVW5TlE7i4z8lBeeawuVrHJ5dJyVPJc8o.dZ5wTW4hloVG', 6);
SELECT * FROM users;

INSERT INTO rooms (room_no, block_name, floor_no, capacity, room_type, is_active)
VALUES ('A-101', 'Block A', 1, 3, 'Regular', 1);
INSERT INTO rooms (room_no, block_name, floor_no, capacity, room_type, is_active)
VALUES ('A-102', 'Block A', 1, 3, 'Regular', 1);
INSERT INTO rooms (room_no, block_name, floor_no, capacity, room_type, is_active)
VALUES ('B-201', 'Block B', 2, 2, 'Regular', 1);
SELECT * FROM rooms;

INSERT INTO students (user_id, full_name, phone, aadhar_no, guardian_name, guardian_phone, address, room_no)
VALUES (
  2,
  'Sample Student',
  '9876543210',
  '123456789012',
  'Sample Guardian',
  '9123456780',
  'Hostel Block A',
  'A-101'
);



SELECT * FROM students;

INSERT INTO leave_requests (user_id, leave_type, from_date, to_date, reason)
VALUES (
  2,
  'Home Visit',
  TO_DATE('2026-02-20', 'YYYY-MM-DD'),
  TO_DATE('2026-02-22', 'YYYY-MM-DD'),
  'Family function'
);
INSERT INTO leave_requests (user_id, leave_type, from_date, to_date, reason, status, reviewed_by, reviewed_at, remarks)
VALUES (
  2,
  'Medical Visit',
  TO_DATE('2026-03-10', 'YYYY-MM-DD'),
  TO_DATE('2026-03-12', 'YYYY-MM-DD'),
  'Doctor appointment outside hostel',
  'Approved',
  1,
  SYSDATE,
  'Approved for medical purpose'
);

SELECT * FROM leave_requests;

INSERT INTO attendance_records (user_id, attendance_date, status, remarks)
VALUES (2, TO_DATE('2026-02-17', 'YYYY-MM-DD'), 'Present', 'On time');
INSERT INTO attendance_records (user_id, attendance_date, status, remarks)
VALUES (2, TO_DATE('2026-02-19', 'YYYY-MM-DD'), 'Present', 'On time');
SELECT * FROM attendance_records;


INSERT INTO student_fees (user_id, term_name, amount_total, amount_paid, due_date, status)
VALUES (2, '2025-26 Term 2', 25000, 12000, TO_DATE('2026-03-10', 'YYYY-MM-DD'), 'Partially Paid');
SELECT * FROM student_fees;

INSERT INTO student_feedback (user_id, facility_area, message, rating, status)
VALUES (2, 'Water Facility', 'Need better water availability during evening hours.', 3, 'Open');
SELECT * FROM student_feedback;


INSERT INTO canteen_menu (menu_date, meal_type, item_name, is_available, created_by)
VALUES (TRUNC(SYSDATE), 'Breakfast', 'Idli and Sambar', 1, 6);
INSERT INTO canteen_menu (menu_date, meal_type, item_name, is_available, created_by)
VALUES (TRUNC(SYSDATE), 'Lunch', 'Rice, Dal, Vegetable Curry', 1, 6);
INSERT INTO canteen_menu (menu_date, meal_type, item_name, is_available, created_by)
VALUES (TRUNC(SYSDATE), 'Dinner', 'Chapati, Paneer Curry', 1, 6);
SELECT * FROM canteen_menu;


INSERT INTO dinner_polls (title, dinner_date, closes_at, status, created_by)
VALUES (
  'Tonight Dinner Poll',
  TRUNC(SYSDATE),
  TRUNC(SYSDATE) + (22/24),
  'Open',
  6
);

INSERT INTO dinner_poll_options (poll_id, option_name, description, display_order)
VALUES (1, 'Paneer Butter Masala Combo', 'Paneer butter masala with chapati and jeera rice', 1);
INSERT INTO dinner_poll_options (poll_id, option_name, description, display_order)
VALUES (1, 'Veg Biryani Combo', 'Veg biryani with raita and salad', 2);
INSERT INTO dinner_poll_options (poll_id, option_name, description, display_order)
VALUES (1, 'South Indian Dinner', 'Masala dosa with chutney and sambar', 3);

INSERT INTO dinner_poll_votes (poll_id, option_id, user_id)
VALUES (1, 1, 2);

SELECT * FROM dinner_polls;
SELECT * FROM dinner_poll_options;
SELECT * FROM dinner_poll_votes;

INSERT INTO system_logs (actor_user_id, actor_role, action, entity_type, entity_id, details)
VALUES (3, 'Technical Staff', 'SEED_INIT', 'SYSTEM', NULL, 'Initial seed data loaded');
SELECT * FROM system_logs;


SELECT * FROM entry_exit_logs;

COMMIT;
 
