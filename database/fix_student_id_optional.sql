-- Modify students table to allow student_id to be NULL
ALTER TABLE students MODIFY COLUMN student_id VARCHAR(20) NULL UNIQUE;
