
INSERT INTO roles (role_name) VALUES ('Admin');
INSERT INTO roles (role_name) VALUES ('Student');
INSERT INTO roles (role_name) VALUES ('Technical Staff');
INSERT INTO roles (role_name) VALUES ('Warden');
INSERT INTO roles (role_name) VALUES ('Security');
INSERT INTO roles (role_name) VALUES ('Canteen Owner');

select * from roles;

INSERT INTO users (email, password, role_id) VALUES ('Admin@gmail.com', '000111', 1);
INSERT INTO users (student_id, password, role_id) VALUES ('STU001', '123456', 2);
INSERT INTO users (emp_id, password, role_id) VALUES ('TES001', '123456', 3);
INSERT INTO users (emp_id, password, role_id) VALUES ('WAR001', '123456', 4);
INSERT INTO users (emp_id, password, role_id) VALUES ('SEC001', '123456', 5);
INSERT INTO users (emp_id, password, role_id) VALUES ('CAN001', '123456', 6);
SELECT * FROM users;

COMMIT;