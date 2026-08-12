-- Add offense_count column to violations table
-- This tracks the offense number for each violation (1-3)

ALTER TABLE violations 
ADD COLUMN offense_count INT DEFAULT 1 AFTER status;

-- Add index for better query performance when counting offenses
CREATE INDEX idx_student_offense ON violations(student_id, offense_count);
