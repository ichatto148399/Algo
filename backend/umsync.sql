-- =============================================
-- UMSync - Subject Loading and Room Assignment
-- Database: umsync
-- =============================================

CREATE DATABASE IF NOT EXISTS umsync;
USE umsync;

-- =============================================
-- TABLE: users
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('admin','registrar','faculty') NOT NULL,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(100),
  department  VARCHAR(100),
  status      ENUM('active','inactive') DEFAULT 'active',
  max_units   INT DEFAULT 21,
  employee_id VARCHAR(50) DEFAULT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE: departments
-- =============================================
CREATE TABLE IF NOT EXISTS departments (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20)  NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL
);

-- =============================================
-- TABLE: programs
-- =============================================
CREATE TABLE IF NOT EXISTS programs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(20)  NOT NULL UNIQUE,
  name          VARCHAR(100) NOT NULL,
  department_id INT NOT NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- =============================================
-- TABLE: subjects
-- =============================================
CREATE TABLE IF NOT EXISTS subjects (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  code       VARCHAR(20)  NOT NULL UNIQUE,
  title      VARCHAR(100) NOT NULL,
  units      INT NOT NULL DEFAULT 3,
  lec_hours  INT DEFAULT 3,
  lab_hours  INT DEFAULT 0,
  type       ENUM('Major','Minor','GE') DEFAULT 'Major',
  program_id INT,
  year_level INT DEFAULT 1,
  semester   ENUM('1st','2nd','Summer') DEFAULT '1st',
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL
);

-- =============================================
-- TABLE: rooms
-- =============================================
CREATE TABLE IF NOT EXISTS rooms (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  number     VARCHAR(20)  NOT NULL UNIQUE,
  building   VARCHAR(100) DEFAULT '',
  type       ENUM('Lecture','Laboratory','Both','Computer Lab','Science Lab','Auditorium','Gymnasium') DEFAULT 'Lecture',
  capacity   INT DEFAULT 40,
  facilities VARCHAR(255) DEFAULT '',
  status     ENUM('available','unavailable') DEFAULT 'available'
);

-- =============================================
-- TABLE: schedules
-- =============================================
CREATE TABLE IF NOT EXISTS schedules (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  subject_id  INT NOT NULL,
  faculty_id  INT NOT NULL,
  room_id     INT NOT NULL,
  section     VARCHAR(20) NOT NULL,
  day         VARCHAR(20) NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  type        ENUM('Lecture','Laboratory') DEFAULT 'Lecture',
  semester    ENUM('1st','2nd','Summer') DEFAULT '1st',
  school_year VARCHAR(20) DEFAULT '2025-2026',
  students    INT DEFAULT 30,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (room_id)    REFERENCES rooms(id)    ON DELETE CASCADE
);

-- =============================================
-- TABLE: change_requests
-- =============================================
CREATE TABLE IF NOT EXISTS change_requests (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  faculty_id   INT NOT NULL,
  schedule_id  INT NOT NULL,
  request_type VARCHAR(50) DEFAULT 'Reschedule',
  reason       TEXT NOT NULL,
  new_day      VARCHAR(20),
  new_time     VARCHAR(50),
  new_room_id  INT,
  status       ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (faculty_id)  REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

-- =============================================
-- TABLE: notifications
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  message    TEXT NOT NULL,
  is_read    TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Users (passwords are plain text for school project)
INSERT INTO users (username, password, role, name, email, department, status, max_units) VALUES
('admin',     'admin123', 'admin',     'System Administrator', 'admin@school.edu',     'IT',   'active', 21),
('registrar', 'reg123',   'registrar', 'Registrar',            'registrar@school.edu', 'REG',  'active', 21),
('faculty1',  'fac123',   'faculty',   'Juan dela Cruz',       'juan@school.edu',      'BSIT', 'active', 21),
('faculty2',  'fac123',   'faculty',   'Maria Santos',         'maria@school.edu',     'BSCS', 'active', 21),
('faculty3',  'fac123',   'faculty',   'Pedro Reyes',          'pedro@school.edu',     'BSIT', 'active', 18);

-- Departments
INSERT INTO departments (code, name) VALUES
('BSIT', 'College of Information Technology'),
('BSCS', 'College of Computer Science'),
('GE',   'General Education');

-- Programs
INSERT INTO programs (code, name, department_id) VALUES
('BSIT', 'BS Information Technology', 1),
('BSCS', 'BS Computer Science',       2),
('BSIS', 'BS Information Systems',    1);

-- Subjects
INSERT INTO subjects (code, title, units, lec_hours, lab_hours, type, program_id, year_level, semester) VALUES
('IT101', 'Introduction to Computing',    3, 3, 0, 'Major', 1, 1, '1st'),
('IT102', 'Computer Programming 1',       3, 2, 3, 'Major', 1, 1, '1st'),
('IT103', 'Computer Programming 2',       3, 2, 3, 'Major', 1, 1, '2nd'),
('IT201', 'Data Structures & Algorithms', 3, 3, 0, 'Major', 1, 2, '1st'),
('IT202', 'Database Management',          3, 3, 0, 'Major', 1, 2, '1st'),
('CS101', 'Discrete Mathematics',         3, 3, 0, 'Major', 2, 1, '1st'),
('CS201', 'Algorithm Design',             3, 3, 0, 'Major', 2, 2, '1st'),
('GE001', 'Mathematics in Modern World',  3, 3, 0, 'GE',    3, 1, '1st'),
('GE002', 'Purposive Communication',      3, 3, 0, 'GE',    3, 1, '1st');

-- Rooms
INSERT INTO rooms (number, building, type, capacity, facilities, status) VALUES
('Room 101', 'Main', 'Lecture',    40, 'Projector, Whiteboard', 'available'),
('Room 102', 'Main', 'Lecture',    40, 'Projector, Whiteboard', 'available'),
('Room 103', 'Main', 'Lecture',    35, 'Whiteboard',            'available'),
('Lab 1',    'Main', 'Laboratory', 30, 'Computers, Projector',  'available'),
('Lab 2',    'Main', 'Laboratory', 30, 'Computers, Projector',  'available'),
('Room 201', 'Main', 'Lecture',    40, 'Projector, Whiteboard', 'available'),
('Room 202', 'Main', 'Lecture',    40, 'Projector, Whiteboard', 'available');

-- Schedules
INSERT INTO schedules (subject_id, faculty_id, room_id, section, day, start_time, end_time, type, semester, school_year, students) VALUES
(1, 3, 1, 'BSIT-1A', 'Monday',    '07:30:00', '09:00:00', 'Lecture',    '1st', '2025-2026', 35),
(2, 3, 4, 'BSIT-1A', 'Tuesday',   '09:00:00', '12:00:00', 'Laboratory', '1st', '2025-2026', 35),
(3, 4, 2, 'BSIT-1B', 'Wednesday', '10:30:00', '12:00:00', 'Lecture',    '1st', '2025-2026', 30),
(4, 4, 1, 'BSIT-2A', 'Thursday',  '13:00:00', '14:30:00', 'Lecture',    '1st', '2025-2026', 28),
(5, 5, 3, 'BSIT-2B', 'Friday',    '07:30:00', '09:00:00', 'Lecture',    '1st', '2025-2026', 32),
(6, 5, 2, 'BSCS-1A', 'Monday',    '10:30:00', '12:00:00', 'Lecture',    '1st', '2025-2026', 25);