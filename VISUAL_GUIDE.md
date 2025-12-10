# Offense Count System - Visual Guide

## User Interface Changes

### 1. Violation Form - New Offense Count Display

**When creating a new violation:**

```
┌─────────────────────────────────────────────────────────────┐
│ Report New Violation                                     [×] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Student *                          Violation Type * [v]   │
│  [Search box...                     │ Type Selection      │  │
│   - John Smith (JS-001)             │ Code - Name (sev)   │  │
│   - Jane Doe (JD-002)               └─────────────────────┘  │
│                                                             │
│  Type: Student Selected             Offense Count         │
│        John Smith                   ┌─────────────────────┐ │
│        JS-001                       │  Offense #2         │ │ ← Orange
│                                     │ (Previous: 1)       │ │
│                                     └─────────────────────┘ │
│                                                             │
│  Incident Date *       Incident Time                       │
│  [2024-12-09]         [14:30]                             │
│                                                             │
│  Location              Description *                       │
│  [Classroom]          [Describe incident...]              │
│                                                             │
│  [Cancel]                                      [Submit]    │
└─────────────────────────────────────────────────────────────┘
```

**Color Coding:**
- 🟢 **Green** - Offense #1 (First violation)
- 🟠 **Orange** - Offense #2 (Second violation)  
- 🔴 **Red** - Offense #3 (Third/repeat violation, maximum)

### 2. Violations Table - New Offense Column

**Before:**
```
Violation # │ Student           │ Type      │ Severity │ Date       │ Status
VIO-001     │ John Smith (001)  │ Truancy   │ Minor    │ 2024-12-01 │ Resolved
VIO-002     │ John Smith (001)  │ Bullying  │ Major    │ 2024-12-05 │ Pending
```

**After (New):**
```
Violation # │ Student           │ Type      │Offense#│ Severity │ Date       │ Status
VIO-001     │ John Smith (001)  │ Truancy   │  #1    │ Minor    │ 2024-12-01 │ Resolved
VIO-002     │ John Smith (001)  │ Bullying  │  #2    │ Major    │ 2024-12-05 │ Pending
                                           ↑
                                   NEW COLUMN ADDED
```

**Offense Column Display:**
```
Student with 1 violation:  [  #1  ]  ← Green badge
Student with 2 violations: [  #2  ]  ← Orange badge  
Student with 3+ violations:[  #3  ]  ← Red badge (CAPPED)
```

---

## Step-by-Step User Workflow

### Scenario: Reporting a repeat offender

#### Step 1: Click "Report Violation"
```
[+ Report Violation] button clicked
    ↓
    Modal form opens
```

#### Step 2: Search and Select Student
```
Search box: "John Smith"
    ↓
Results appear:
  • JS-001 - John Smith (2 previous violations)
    ↓
Click on "John Smith"
    ↓
Form auto-populates:
  - Student ID: JS-001
  - Offense Count: #2 (displayed in orange)
```

#### Step 3: See Offense Count Preview
```
Offense Count Box:
┌─────────────────────────────┐
│  Offense #2                 │  ← Color: Orange (warning)
│  Previous violations: 2     │
└─────────────────────────────┘
```

#### Step 4: Fill in Violation Details
```
Violation Type: [Bullying]
Incident Date: [2024-12-09]
Incident Time: [14:30]
Location: [Hallway]
Description: [Student bullied another student...]
```

#### Step 5: Submit Violation
```
[Submit] button clicked
    ↓
Backend calculates: count(violations) + 1 = 3
    ↓
Violation saved with offense_count = 2
    ↓
Form closes
```

#### Step 6: View in Table
```
New violation appears in table:
┌─────────────────────────────────────────┐
│ VIO-003 │ John Smith │ Bullying │ #2 │  │
│         │ JS-001     │          │    │  │
└─────────────────────────────────────────┘
           Offense column shows #2 in orange
```

---

## Offense Count Rules

```
Student History                  Next Violation          Result
─────────────────────────────────────────────────────────────
No violations                    Create violation  →  Offense #1 🟢
                                                    (First offense)

1 violation                      Create violation  →  Offense #2 🟠
                                                    (Second offense)

2 violations                     Create violation  →  Offense #3 🔴
                                                    (Third offense)

3+ violations                    Create violation  →  Offense #3 🔴
                                                    (CAPPED - no higher)
```

---

## API Responses

### GET /api/students/123
```json
{
  "student": {
    "id": 123,
    "student_id": "JS-001",
    "first_name": "John",
    "last_name": "Smith",
    "course": "BS Computer Science",
    "violation_count": 2        ← New field
  }
}
```

### POST /api/violations (Response)
```json
{
  "success": true,
  "violation": {
    "id": 999,
    "violation_number": "VIO-12345-001",
    "student_id": 123,
    "offense_count": 2,         ← New field (calculated)
    "status": "pending",
    "created_at": "2024-12-09T14:30:00Z"
  }
}
```

### GET /api/violations
```json
{
  "violations": [
    {
      "id": 1,
      "violation_number": "VIO-001",
      "first_name": "John",
      "last_name": "Smith",
      "violation_type_name": "Truancy",
      "offense_count": 1,       ← New field in each violation
      "severity": "minor",
      "status": "resolved"
    },
    {
      "id": 2,
      "violation_number": "VIO-002",
      "first_name": "John",
      "last_name": "Smith",
      "violation_type_name": "Bullying",
      "offense_count": 2,       ← New field
      "severity": "major",
      "status": "pending"
    }
  ]
}
```

---

## Color Scheme Reference

| Offense | Color | Hex Code | Badge Style |
|---------|-------|----------|-------------|
| #1 | Green | `bg-green-100 text-green-800` | 🟢 First offense |
| #2 | Orange | `bg-orange-100 text-orange-800` | 🟠 Warning |
| #3 | Red | `bg-red-100 text-red-800` | 🔴 Critical/Capped |

---

## Database View

### Violations Table Structure
```
violations
├── id (PK)
├── violation_number (unique)
├── student_id (FK)
├── violation_type_id (FK)
├── reported_by (FK)
├── incident_date
├── incident_time
├── location
├── description
├── status
├── offense_count  ← NEW COLUMN
├── resolution_notes
├── resolved_by
├── resolved_at
├── created_at
└── updated_at

Index: idx_student_offense (student_id, offense_count)
```

### Example Data
```
id  │ student_id │ violation_number │ offense_count │ status   │ created_at
────┼────────────┼──────────────────┼───────────────┼──────────┼──────────────
1   │ 5          │ VIO-12345-001    │ 1             │ pending  │ 2024-12-01
2   │ 5          │ VIO-12345-002    │ 2             │ pending  │ 2024-12-05
3   │ 5          │ VIO-12345-003    │ 3             │ pending  │ 2024-12-09
4   │ 5          │ VIO-12345-004    │ 3             │ pending  │ 2024-12-10
5   │ 8          │ VIO-12345-005    │ 1             │ resolved │ 2024-12-08
```

---

## Keyboard Shortcuts & Tips

| Action | Shortcut/Tip |
|--------|--------------|
| Quick search student | Type at least 2 characters in search box |
| Form auto-fills | Student offense count updates automatically |
| Color indication | Orange/Red = repeat offender, may need intervention |
| View history | Click student name to see all their violations |
| Export data | Use violations table export (future feature) |

---

## Common Scenarios

### ✅ First Offender
**Student:** Jane Doe (0 previous violations)
- Form shows: `Offense #1` in green ✓
- Badge displays: `#1` green
- Action: May issue warning

### ⚠️ Repeat Offender
**Student:** John Smith (1 previous violation)
- Form shows: `Offense #2` in orange ⚠️
- Badge displays: `#2` orange
- Action: May escalate to parent call

### 🛑 Serious Offender  
**Student:** Alex Johnson (2 previous violations)
- Form shows: `Offense #3` in red 🛑
- Badge displays: `#3` red (CAPPED)
- Action: May recommend suspension

### 🛑🛑 Beyond Maximum
**Student:** Sam Lee (3+ previous violations)
- Form shows: `Offense #3` in red 🛑 (NOT #4)
- Badge displays: `#3` red (CAPPED)
- Note: Always capped at 3, cannot go higher

---

## Troubleshooting Visual Issues

### Issue: Offense count not showing
**Solution:** 
- Refresh page (Ctrl+F5)
- Check if student is properly selected
- Verify database migration was applied

### Issue: All students show #1
**Solution:**
- Run backfill SQL to populate offense counts
- Ensure new violations get automatic counts

### Issue: Wrong color for offense
**Solution:**
- Clear browser cache
- Verify CSS classes are applied correctly
- Check that offense_count field exists in database
