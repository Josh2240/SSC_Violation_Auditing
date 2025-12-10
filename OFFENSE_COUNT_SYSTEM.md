# Offense Count System Implementation

## Overview
This system now tracks repeat violations for students. When a student receives a new violation, the system automatically counts how many violations they have. The offense count ranges from 1 (first offense) to 3 (maximum).

## What Changed

### 1. Database Schema Update
Added a new column to the `violations` table:
- `offense_count INT DEFAULT 1` - Tracks which offense number this is (1-3)

**Migration SQL:**
```sql
ALTER TABLE violations 
ADD COLUMN offense_count INT DEFAULT 1 AFTER status;

CREATE INDEX idx_student_offense ON violations(student_id, offense_count);
```

### 2. Backend Changes

#### API Endpoint: `POST /api/violations` (Creating new violations)
- Added `calculateOffenseCount()` function that:
  - Counts existing violations for the student
  - Adds 1 to the count for the new violation
  - Caps the value at maximum 3
  - Returns minimum 1 (first offense)
- When creating a violation, the offense count is automatically calculated and stored

#### API Endpoint: `GET /api/students/[id]` (Getting student details)
- Now includes `violation_count` field showing total violations for that student
- Used by the form to calculate the next offense number

### 3. Frontend Changes

#### ViolationForm Component (`components/ViolationForm.tsx`)
- Added `offenseCount` state to track offense number
- Added `calculateOffenseCount()` function that queries the student endpoint
- When a student is selected, automatically calculates their next offense number
- Displays offense count with color coding:
  - **Green (#1)** - First offense
  - **Orange (#2)** - Second offense  
  - **Red (#3)** - Third (final) offense
- Shows "Select a student" message until a student is chosen

#### Violations Page (`app/violations/page.tsx`)
- Updated table to display Offense # column
- Shows offense number for each violation with color-coded badges
- Column order: Violation # → Student → Type → **Offense #** → Severity → Date → Status → Reported By → Actions

## How It Works

### When a student commits a violation:
1. User fills out the violation form and selects a student
2. System queries database for that student's current violation count
3. Next offense number is calculated: `Math.min(Math.max(count + 1, 1), 3)`
4. User submits the violation
5. System inserts violation with calculated offense_count
6. Offense number is displayed in the violations list

### Offense Count Logic:
- **Offense 1**: First violation (0 existing violations + 1)
- **Offense 2**: Second violation (1 existing violation + 1)
- **Offense 3**: Third or more violations (capped at 3)

## Database Query Examples

### Count violations for a student:
```sql
SELECT COUNT(*) as violation_count FROM violations WHERE student_id = 1;
```

### Get all violations for a student with their offense counts:
```sql
SELECT offense_count, violation_number, incident_date 
FROM violations 
WHERE student_id = 1 
ORDER BY created_at ASC;
```

### Get students with the most violations:
```sql
SELECT 
  s.id, 
  s.student_id,
  s.first_name,
  s.last_name,
  COUNT(v.id) as total_violations,
  MAX(v.offense_count) as max_offense
FROM students s
LEFT JOIN violations v ON s.id = v.student_id
GROUP BY s.id
ORDER BY total_violations DESC;
```

## Migration Steps

1. **Backup your database** before applying changes
2. Run the SQL migration:
   ```sql
   ALTER TABLE violations 
   ADD COLUMN offense_count INT DEFAULT 1 AFTER status;
   
   CREATE INDEX idx_student_offense ON violations(student_id, offense_count);
   ```
3. Deploy the updated backend code
4. Deploy the updated frontend code
5. Test by:
   - Creating a new violation for a student with no prior violations (should show Offense #1)
   - Creating another violation for the same student (should show Offense #2)
   - Creating a third violation (should show Offense #3)
   - Creating additional violations (should remain at Offense #3)

## Validation

- Offense count is automatically calculated on the backend (secure)
- Frontend shows preview before submission
- Color coding makes it easy to identify repeat offenders at a glance
- Minimum 1, Maximum 3 constraint is enforced

## Files Modified

1. `database/add_offense_count.sql` - Migration file (new)
2. `app/api/violations/route.ts` - Added offense count calculation
3. `app/api/students/[id]/route.ts` - Added violation count to response
4. `components/ViolationForm.tsx` - Added offense count display and calculation
5. `app/violations/page.tsx` - Added offense count column to table
