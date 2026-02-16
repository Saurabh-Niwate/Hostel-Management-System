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
  role_id NUMBER,
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

CREATE TABLE leave_requests (
  leave_id NUMBER PRIMARY KEY,
  user_id NUMBER,
  from_date DATE,
  to_date DATE,
  reason VARCHAR2(255),
  status VARCHAR2(20) DEFAULT 'Pending',
  CONSTRAINT fk_user FOREIGN KEY (user_id)
    REFERENCES users(user_id)
);

CREATE SEQUENCE leave_seq
START WITH 1
INCREMENT BY 1;

CREATE OR REPLACE TRIGGER leave_trigger
BEFORE INSERT ON leave_requests
FOR EACH ROW
BEGIN
  SELECT leave_seq.NEXTVAL
  INTO :NEW.leave_id
  FROM dual;
END;
/

INSERT INTO roles (role_name) VALUES ('Admin');
INSERT INTO roles (role_name) VALUES ('Student');
INSERT INTO roles (role_name) VALUES ('Technical Staff');
INSERT INTO roles (role_name) VALUES ('Warden');
INSERT INTO roles (role_name) VALUES ('Security');
INSERT INTO roles (role_name) VALUES ('CanteenOwner');

COMMIT;

SELECT * FROM roles;


INSERT INTO users (student_id, password, role_id)
VALUES ('STU001', '2006', 2);

SELECT * FROM users;

INSERT INTO users (student_id, password, role_id)
VALUES ('STU002', '2007', 2);
SELECT * FROM users;
desc users;

SELECT *
FROM users
WHERE student_id = 'STU001';


SELECT owner, table_name
FROM all_tables
WHERE table_name = 'USERS';

desc users;

SELECT u.user_id, u.password, r.role_name
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE u.student_id = 'STU001';

SELECT student_id,
       LENGTH(student_id),
       DUMP(student_id)
FROM users;