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
INSERT INTO users (student_id, emp_id, email, password, role_id) VALUES ('STU002', NULL, 'stu2@hostel.com', '$2b$10$8sSjODD1wbhraCp779fRpeBUfb1fKHaA8lmp0yl6XakJ70c3hKwRG', 2);
INSERT INTO users (student_id, emp_id, email, password, role_id) VALUES ('STU003', NULL, 'stu3@hostel.com', '$2b$10$8sSjODD1wbhraCp779fRpeBUfb1fKHaA8lmp0yl6XakJ70c3hKwRG', 2);
INSERT INTO users (student_id, emp_id, email, password, role_id) VALUES ('STU004', NULL, 'stu4@hostel.com', '$2b$10$8sSjODD1wbhraCp779fRpeBUfb1fKHaA8lmp0yl6XakJ70c3hKwRG', 2);
INSERT INTO users (student_id, emp_id, email, password, role_id) VALUES ('STU005', NULL, 'stu5@hostel.com', '$2b$10$8sSjODD1wbhraCp779fRpeBUfb1fKHaA8lmp0yl6XakJ70c3hKwRG', 2);

select * from users;
INSERT INTO rooms (room_no, block_name, floor_no, capacity, room_type, is_active) VALUES ('A-101', 'Block A', 1, 4, 'Regular', 1);


INSERT INTO students (user_id, full_name, phone, aadhar_no, guardian_name, guardian_email, guardian_phone, address, room_no) VALUES (2,'Sample Student','9876543210','123456789012','Sample Guardian','guardian@example.com','9123456780','Hostel Block A','A-101');


INSERT INTO students (user_id, full_name, phone, aadhar_no, guardian_name, guardian_email, guardian_phone, address, room_no) VALUES (7, 'Student Two', '9000000002', '123456789002', 'Sample Guardian 2', 'guardian2@example.com', '9123456781', 'Hostel Block A', 'A-101');
INSERT INTO students (user_id, full_name, phone, aadhar_no, guardian_name, guardian_email, guardian_phone, address, room_no) VALUES (8, 'Student Three', '9000000003', '123456789003', 'Sample Guardian 2', 'guardian3@example.com', '9123456782', 'Hostel Block A', 'A-101');
INSERT INTO students (user_id, full_name, phone, aadhar_no, guardian_name, guardian_email, guardian_phone, address, room_no) VALUES (9, 'Student Four', '9000000004', '123456789004', 'Sample Guardian 2', 'guardian4@example.com', '9123456783', 'Hostel Block A', 'A-101');
INSERT INTO students (user_id, full_name, phone, aadhar_no, guardian_name, guardian_email, guardian_phone, address, room_no) VALUES (10, 'Student Five', '9000000005', '123456789005', 'Sample Guardian 5', 'guardian5@example.com', '9123456784', 'Hostel Block A', null);



INSERT INTO leave_requests (user_id, leave_type, from_date, to_date, reason, status) VALUES (2, 'Event', SYSDATE-20, SYSDATE-18, 'Hackathon', 'Approved');
INSERT INTO leave_requests (user_id, leave_type, from_date, to_date, reason, status) VALUES (2, 'Home Visit', SYSDATE+10, SYSDATE+15, 'Vacation', 'Pending');
INSERT INTO leave_requests (user_id, leave_type, from_date, to_date, reason, status) VALUES (7, 'Home Visit', SYSDATE-5, SYSDATE-2, 'Visiting parents', 'Approved');
INSERT INTO leave_requests (user_id, leave_type, from_date, to_date, reason, status) VALUES (7, 'Medical', SYSDATE+5, SYSDATE+10, 'Health checkup', 'Pending');
INSERT INTO leave_requests (user_id, leave_type, from_date, to_date, reason, status) VALUES (8, 'Personal', SYSDATE-10, SYSDATE-8, 'Personal work', 'Approved');
INSERT INTO leave_requests (user_id, leave_type, from_date, to_date, reason, status) VALUES (8, 'Home Visit', SYSDATE+2, SYSDATE+5, 'Sibling marriage', 'Pending');
INSERT INTO leave_requests (user_id, leave_type, from_date, to_date, reason, status) VALUES (9, 'Medical', SYSDATE-15, SYSDATE-10, 'Fever', 'Approved');
INSERT INTO leave_requests (user_id, leave_type, from_date, to_date, reason, status) VALUES (9, 'Event', SYSDATE+1, SYSDATE+3, 'Tech fest', 'Pending');

INSERT INTO attendance_records (user_id, attendance_date, status, remarks) VALUES (2, TRUNC(SYSDATE), 'Present', 'On time');
INSERT INTO attendance_records (user_id, attendance_date, status, remarks) VALUES (7, TRUNC(SYSDATE), 'Present', 'On time');
INSERT INTO attendance_records (user_id, attendance_date, status, remarks) VALUES (8, TRUNC(SYSDATE), 'Absent', 'Sick');
INSERT INTO attendance_records (user_id, attendance_date, status, remarks) VALUES (9, TRUNC(SYSDATE), 'Present', 'On time');

INSERT INTO student_fees (user_id, term_name, amount_total, amount_paid, status) VALUES (2, 'Spring 2026', 50000, 50000, 'Paid');
INSERT INTO student_fees (user_id, term_name, amount_total, amount_paid, status) VALUES (7, 'Spring 2026', 50000, 25000, 'Partially Paid');
INSERT INTO student_fees (user_id, term_name, amount_total, amount_paid, status) VALUES (8, 'Spring 2026', 50000, 0, 'Pending');
INSERT INTO student_fees (user_id, term_name, amount_total, amount_paid, status) VALUES (9, 'Spring 2026', 50000, 50000, 'Paid');

INSERT INTO canteen_menu (menu_date, meal_type, item_name, is_available, created_by) VALUES (TRUNC(SYSDATE), 'Breakfast', 'Idli and Sambar', 1, 1);
INSERT INTO canteen_menu (menu_date, meal_type, item_name, is_available, created_by) VALUES (TRUNC(SYSDATE), 'Breakfast', 'Poha and Jalebi', 1, 1);
INSERT INTO canteen_menu (menu_date, meal_type, item_name, is_available, created_by) VALUES (TRUNC(SYSDATE), 'Lunch', 'Paneer Butter Masala', 1, 1);
INSERT INTO canteen_menu (menu_date, meal_type, item_name, is_available, created_by) VALUES (TRUNC(SYSDATE), 'Lunch', 'Chicken Biryani', 1, 1);
INSERT INTO canteen_menu (menu_date, meal_type, item_name, is_available, created_by) VALUES (TRUNC(SYSDATE), 'Lunch', 'Dal Makhani and Roti', 1, 1);


INSERT INTO dinner_polls (title, dinner_date, closes_at, status, created_by) VALUES ('Today Dinner Poll', TRUNC(SYSDATE), TRUNC(SYSDATE) + 1, 'Open', 1);
INSERT INTO dinner_polls (title, dinner_date, closes_at, status, created_by) VALUES ('Tomorrow Dinner Poll', TRUNC(SYSDATE) + 1, TRUNC(SYSDATE) + 2, 'Open', 1);
INSERT INTO dinner_poll_options (poll_id, option_name, description, display_order) VALUES (1, 'Veg Thali', 'Dal, Roti, Rice, Sabzi', 1);
INSERT INTO dinner_poll_options (poll_id, option_name, description, display_order) VALUES (1, 'Chicken Curry', 'Spicy Chicken with Rice', 2);
INSERT INTO dinner_poll_options (poll_id, option_name, description, display_order) VALUES (1, 'Paneer Tikka', 'Paneer Tikka with Naan', 3);
INSERT INTO dinner_poll_options (poll_id, option_name, description, display_order) VALUES (1, 'Egg Bhurji', 'Egg Bhurji with Paratha', 4);

INSERT INTO dinner_poll_options (poll_id, option_name, description, display_order) VALUES (2, 'Mutton Biryani', 'Mutton Dum Biryani', 1);
INSERT INTO dinner_poll_options (poll_id, option_name, description, display_order) VALUES (2, 'Veg Biryani', 'Vegetable Dum Biryani', 2);
INSERT INTO dinner_poll_options (poll_id, option_name, description, display_order) VALUES (2, 'Fish Fry Meal', 'Fish Fry with Dal Rice', 3);
INSERT INTO dinner_poll_options (poll_id, option_name, description, display_order) VALUES (2, 'Palak Paneer', 'Palak Paneer with Roti', 4);


INSERT INTO student_feedback (user_id, facility_area, message, rating, status)
VALUES (2, 'Water Facility', 'Need better water availability during evening hours.', 3, 'Open');
SELECT * FROM student_feedback;


INSERT INTO system_logs (actor_user_id, actor_role, action, entity_type, entity_id, details)
VALUES (3, 'Technical Staff', 'SEED_INIT', 'SYSTEM', NULL, 'Initial seed data loaded');
SELECT * FROM system_logs;


-- Nearby Stay (External Accommodations) Seed Data
INSERT INTO external_accommodations (name, accommodation_type, address, distance_km, contact_phone, contact_email, rent_min, rent_max, gender_allowed, availability_status, notes, created_by)
VALUES ('Sunrise PG Hostel', 'PG', 'Plot 12, Sector 5, Near College Gate, Pune', 0.5, '9876501001', 'sunrise.pg@gmail.com', 4000, 6000, 'Male', 'Available', 'Meals included. Wi-Fi available. 24/7 water supply.', 1);

INSERT INTO external_accommodations (name, accommodation_type, address, distance_km, contact_phone, contact_email, rent_min, rent_max, gender_allowed, availability_status, notes, created_by)
VALUES ('Green Valley Girls PG', 'PG', 'Lane 3, Kothrud, Pune', 0.8, '9876501002', 'greenvalley.pg@gmail.com', 5000, 7500, 'Female', 'Available', 'Female students only. CCTV security and warden available. Home-cooked meals.', 1);

INSERT INTO external_accommodations (name, accommodation_type, address, distance_km, contact_phone, contact_email, rent_min, rent_max, gender_allowed, availability_status, notes, created_by)
VALUES ('City Dormitory Hostel', 'Dormitory', 'Main Road, Aundh, Pune', 1.2, '9876501003', 'citydorm@hostel.com', 3000, 4500, 'Any', 'Available', 'Affordable shared dormitory. Separate wings for male and female. Laundry facility available.', 1);



SELECT * FROM external_accommodations;

COMMIT;
 
