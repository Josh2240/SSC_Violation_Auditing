# Quick Setup Guide - Offense Count System

## Prerequisites
- Database access (phpMyAdmin, MySQL CLI, or similar)
- Application already deployed

## Step 1: Update Database

Run this SQL command in your database:

```sql
ALTER TABLE violations 
ADD COLUMN offense_count INT DEFAULT 1 AFTER status;

CREATE INDEX idx_student_offense ON violations(student_id, offense_count);
```

**For existing violations**, you can populate offense counts automatically:

```sql
-- This sets correct offense counts for existing violations
SET @student_id = NULL;
SET @offense = 0;

UPDATE violations v
SET offense_count = (
  SELECT COUNT(*) FROM violations v2 
  WHERE v2.student_id = v.student_id 
  AND v2.created_at <= v.created_at
)
ORDER BY student_id, created_at;
```

## Step 2: Deploy Code Changes

Replace these files with the updated versions:

1. `app/api/violations/route.ts` - New offense count calculation
2. `app/api/students/[id]/route.ts` - Added violation count
3. `components/ViolationForm.tsx` - New offense count display
4. `app/violations/page.tsx` - New offense column in table

## Step 3: Restart Application

```bash
npm start
```

## Testing

### Test Case 1: First Offense
1. Go to Violations → Report Violation
2. Select a student with NO prior violations
3. Verify "Offense #1" displays in green
4. Submit the violation
5. Confirm it shows as Offense #1 in the table

### Test Case 2: Second Offense
1. Go to Violations → Report Violation
2. Select the same student
3. Verify "Offense #2" displays in orange
4. Submit the violation
5. Confirm it shows as Offense #2 in the table

### Test Case 3: Third Offense (Maximum)
1. Go to Violations → Report Violation
2. Select the same student again
3. Verify "Offense #3" displays in red
4. Submit the violation
5. Confirm it shows as Offense #3 in the table

### Test Case 4: Beyond Maximum
1. Go to Violations → Report Violation
2. Select the same student again
3. Verify it STILL shows "Offense #3" (capped at 3)
4. Submit the violation
5. Confirm it shows as Offense #3 in the table (NOT #4)

## Feature Highlights

✅ **Automatic Calculation** - No manual entry needed  
✅ **Color Coded** - Green (1st) → Orange (2nd) → Red (3rd)  
✅ **Capped at 3** - Cannot exceed 3 offenses  
✅ **Minimum 1** - Always starts at 1st offense  
✅ **Persistent** - Stored in database for reporting  
✅ **Real-time** - Updates instantly when selecting student  

## Troubleshooting

### "Offense count not showing"
- Ensure database migration was applied
- Restart the application
- Clear browser cache (Ctrl+F5)

### "Offense count is wrong"
- Check that `offense_count` column exists in violations table
- Run the backfill SQL query to fix existing violations
- New violations will always have correct counts

### "Page not loading"
- Check browser console for errors
- Verify all files were updated correctly
- Check that TypeScript compiles without errors

## Additional Notes

- Offense count is calculated server-side (secure)
- Form shows preview before submission
- Each student's offense count is independent
- Offense count cannot be manually edited (calculated on insert)
- Archived/dismissed violations still count toward offense number
