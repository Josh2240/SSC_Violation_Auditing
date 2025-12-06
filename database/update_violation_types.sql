-- Update violation types to new dress code violations
-- Run this script if you already have an existing database

USE student_violation_db;

-- Delete old violation types (if they exist)
DELETE FROM violation_types WHERE code IN ('V001', 'V002', 'V003', 'V004', 'V005', 'V006', 'V007', 'V008');

-- Insert new violation types
INSERT INTO violation_types (code, name, description, severity) VALUES
('V001', 'No ID', 'Student not wearing or presenting identification', 'minor'),
('V002', 'Earrings', 'Wearing earrings in violation of dress code', 'minor'),
('V003', 'No Uniform', 'Student not wearing proper uniform', 'minor'),
('V004', 'No shoes', 'Student not wearing appropriate footwear', 'minor'),
('V005', 'Revealing clothes', 'Wearing revealing clothes such as crop-top, up-shoulder, double lining', 'minor')
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    severity = VALUES(severity);

