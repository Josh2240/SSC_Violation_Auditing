-- Update violation types to new dress code violations
-- Run this script if you already have an existing database

USE student_violation_db;

-- Update existing violation types to new severity levels
UPDATE violation_types SET severity = 'major' WHERE code = 'V001';
UPDATE violation_types SET severity = 'major' WHERE code = 'V002';
UPDATE violation_types SET severity = 'major' WHERE code = 'V003';
UPDATE violation_types SET severity = 'minor' WHERE code = 'V004';
UPDATE violation_types SET severity = 'major' WHERE code = 'V005';

-- Insert new violation types if they don't exist
INSERT IGNORE INTO violation_types (code, name, description, severity) VALUES
('V001', 'No ID', 'Student not wearing or presenting identification', 'major'),
('V002', 'Earrings', 'Wearing earrings in violation of dress code', 'major'),
('V003', 'No Uniform', 'Student not wearing proper uniform', 'major'),
('V004', 'No shoes', 'Student not wearing appropriate footwear', 'minor'),
('V005', 'Revealing clothes', 'Wearing revealing clothes such as crop-top, up-shoulder, double lining', 'major');

