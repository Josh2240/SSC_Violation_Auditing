import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

// Generate violation number
function generateViolationNumber(): string {
  const prefix = 'VIO';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

// Calculate offense count for a student
// Returns a count from 1-3, where 3 is the maximum
async function calculateOffenseCount(studentId: number): Promise<number> {
  const result = await query(
    'SELECT COUNT(*) as violation_count FROM violations WHERE student_id = ?',
    [studentId]
  ) as any[];
  
  const violationCount = result[0]?.violation_count || 0;
  // Cap at 3, minimum 1
  return Math.min(Math.max(violationCount + 1, 1), 3);
}

// GET all violations
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const course = searchParams.get('course') || '';
    const studentId = searchParams.get('student_id') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let sql = `SELECT v.*, 
               s.student_id as student_number, s.first_name, s.last_name, s.course, s.year_level,
               vt.name as violation_type_name, vt.severity,
               u1.full_name as reported_by_name,
               u2.full_name as resolved_by_name
               FROM violations v
               LEFT JOIN students s ON v.student_id = s.id
               LEFT JOIN violation_types vt ON v.violation_type_id = vt.id
               LEFT JOIN users u1 ON v.reported_by = u1.id
               LEFT JOIN users u2 ON v.resolved_by = u2.id
               WHERE 1=1`;
    const params: any[] = [];

    if (search) {
      sql += ' AND (LOWER(v.violation_number) LIKE LOWER(?) OR LOWER(s.student_id) LIKE LOWER(?) OR LOWER(s.first_name) LIKE LOWER(?) OR LOWER(s.last_name) LIKE LOWER(?))';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (status) {
      sql += ' AND v.status = ?';
      params.push(status);
    }
    if (course) {
      sql += ' AND s.course = ?';
      params.push(course);
    }
    if (studentId) {
      sql += ' AND v.student_id = ?';
      params.push(studentId);
    }

    sql += ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const violations = await query(sql, params) as any[];

    // Get total count
    let countSql = `SELECT COUNT(*) as total 
                    FROM violations v
                    LEFT JOIN students s ON v.student_id = s.id
                    WHERE 1=1`;
    const countParams: any[] = [];
    
    if (search) {
      countSql += ' AND (LOWER(v.violation_number) LIKE LOWER(?) OR LOWER(s.student_id) LIKE LOWER(?) OR LOWER(s.first_name) LIKE LOWER(?) OR LOWER(s.last_name) LIKE LOWER(?))';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (status) {
      countSql += ' AND v.status = ?';
      countParams.push(status);
    }
    if (course) {
      countSql += ' AND s.course = ?';
      countParams.push(course);
    }
    if (studentId) {
      countSql += ' AND v.student_id = ?';
      countParams.push(studentId);
    }

    const countResult = await query(countSql, countParams) as any[];

    return NextResponse.json({
      violations,
      pagination: {
        total: countResult[0]?.total || 0,
        page,
        limit,
        totalPages: Math.ceil((countResult[0]?.total || 0) / limit),
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get violations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new violation
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const data = await request.json();

    const { student_id, violation_type_id, incident_date, incident_time, location, description } = data;

    if (!student_id || !violation_type_id || !incident_date || !description) {
      return NextResponse.json(
        { error: 'Student ID, violation type, incident date, and description are required' },
        { status: 400 }
      );
    }

    // Verify student exists
    const students = await query('SELECT id FROM students WHERE id = ?', [student_id]) as any[];
    if (students.length === 0) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Verify violation type exists
    const violationTypes = await query('SELECT id FROM violation_types WHERE id = ?', [violation_type_id]) as any[];
    if (violationTypes.length === 0) {
      return NextResponse.json(
        { error: 'Violation type not found' },
        { status: 404 }
      );
    }

    const violation_number = generateViolationNumber();

    // Calculate offense count for this student
    const offenseCount = await calculateOffenseCount(student_id);

    const result = await query(
      `INSERT INTO violations 
       (violation_number, student_id, violation_type_id, reported_by, incident_date, incident_time, location, description, status, offense_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        violation_number,
        student_id,
        violation_type_id,
        user.id,
        incident_date,
        incident_time || null,
        location || null,
        description,
        offenseCount,
      ]
    ) as any;

    const violationId = result.insertId;

    // Create audit log
    await createAuditLog({
      table_name: 'violations',
      record_id: violationId,
      action: 'INSERT',
      user_id: user.id,
      new_values: { ...data, violation_number, reported_by: user.id, offense_count: offenseCount },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      violation: { id: violationId, violation_number, offense_count: offenseCount, ...data },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create violation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

