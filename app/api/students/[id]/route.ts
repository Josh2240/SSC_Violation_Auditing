import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

// GET single student
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);
    
    const students = await query('SELECT * FROM students WHERE id = ?', [params.id]) as any[];
    
    if (students.length === 0) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Get violation count for this student
    const violationResult = await query(
      'SELECT COUNT(*) as violation_count FROM violations WHERE student_id = ?',
      [params.id]
    ) as any[];

    const student = {
      ...students[0],
      violation_count: violationResult[0]?.violation_count || 0,
    };

    return NextResponse.json({ student });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update student
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const data = await request.json();

    // Get old values
    const oldStudent = await query('SELECT * FROM students WHERE id = ?', [params.id]) as any[];
    if (oldStudent.length === 0) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const { first_name, last_name, middle_name, email, phone, course, year_level, section } = data;

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

    await query(
      `UPDATE students 
       SET first_name = ?, last_name = ?, middle_name = ?, email = ?, phone = ?, course = ?, year_level = ?, section = ?
       WHERE id = ?`,
      [
        first_name.trim(),
        last_name.trim(),
        middle_name && middle_name.trim() ? middle_name.trim() : null,
        email && email.trim() ? email.trim() : null,
        phone && phone.trim() ? phone.trim() : null,
        course && course.trim() ? course.trim() : null,
        year_level && year_level.trim() ? year_level.trim() : null,
        section && section.trim() ? section.trim() : null,
        params.id,
      ]
    );

    // Create audit log
    await createAuditLog({
      table_name: 'students',
      record_id: parseInt(params.id),
      action: 'UPDATE',
      user_id: user.id,
      old_values: oldStudent[0],
      new_values: data,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Update student error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE student
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    // Check if student has violations
    const violations = await query('SELECT COUNT(*) as count FROM violations WHERE student_id = ?', [params.id]) as any[];
    if (violations[0]?.count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete student with existing violations' },
        { status: 400 }
      );
    }

    // Get old values for audit
    const oldStudent = await query('SELECT * FROM students WHERE id = ?', [params.id]) as any[];
    if (oldStudent.length === 0) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    await query('DELETE FROM students WHERE id = ?', [params.id]);

    // Create audit log
    await createAuditLog({
      table_name: 'students',
      record_id: parseInt(params.id),
      action: 'DELETE',
      user_id: user.id,
      old_values: oldStudent[0],
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

