

INSERT INTO roles (role_name) VALUES ('Admin');
INSERT INTO roles (role_name) VALUES ('Student');
INSERT INTO roles (role_name) VALUES ('Technical Staff');
INSERT INTO roles (role_name) VALUES ('Warden');
INSERT INTO roles (role_name) VALUES ('Security');
INSERT INTO roles (role_name) VALUES ('CanteenOwner');

select * from roles;

INSERT INTO users (student_id, password, role_id) VALUES ('STU001', '123456', 2);
SELECT * FROM users;

INSERT INTO users (email, password, role_id) VALUES ('Admin@gmail.com', '000111', 1);
SELECT * FROM users;

COMMIT;