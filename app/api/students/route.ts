import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth, getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

// GET all students
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM students WHERE 1=1';
    const params: any[] = [];

    if (search) {
      sql += ' AND (student_id LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

   sql += ` ORDER BY last_name, first_name LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const students = await query(sql, params) as any[];
    const countResult = await query(
      'SELECT COUNT(*) as total FROM students' + (search ? ' WHERE student_id LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ?' : ''),
      search ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`] : []
    ) as any[];

    return NextResponse.json({
      students,
      pagination: {
        total: countResult[0]?.total || 0,
        page,
        limit,
        totalPages: Math.ceil((countResult[0]?.total || 0) / limit),
      },
    });


  } catch (error: any) {
    console.error("Students API Error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: error.message,
       stack: error.stack,
     },
      { status: 500 }
    );
  }
}

// POST create new student
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const data = await request.json();

    const { student_id, first_name, last_name, middle_name, email, phone, course, year_level, section } = data;

    // Validate required fields
    if (!first_name || !first_name.trim()) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      );
    }

    if (!last_name || !last_name.trim()) {
      return NextResponse.json(
        { error: 'Last name is required' },
        { status: 400 }
      );
    }

    // If student_id provided, check if it already exists
    if (student_id && student_id.trim()) {
      const existing = await query('SELECT id FROM students WHERE student_id = ?', [student_id.trim()]) as any[];
      if (existing.length > 0) {
        return NextResponse.json(
          { error: 'Student ID already exists' },
          { status: 400 }
        );
      }
    }

    const result = await query(
      `INSERT INTO students (student_id, first_name, last_name, middle_name, email, phone, course, year_level, section)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student_id && student_id.trim() ? student_id.trim() : null,
        first_name.trim(),
        last_name.trim(),
        middle_name && middle_name.trim() ? middle_name.trim() : null,
        email && email.trim() ? email.trim() : null,
        phone && phone.trim() ? phone.trim() : null,
        course && course.trim() ? course.trim() : null,
        year_level && year_level.trim() ? year_level.trim() : null,
        section && section.trim() ? section.trim() : null,
      ]
    ) as any;

    const studentId = result.insertId;

    // Create audit log
    await createAuditLog({
      table_name: 'students',
      record_id: studentId,
      action: 'INSERT',
      user_id: user.id,
      new_values: data,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      student: { id: studentId, ...data },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create student error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

