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

    return NextResponse.json({ student: students[0] });
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

    await query(
      `UPDATE students 
       SET first_name = ?, last_name = ?, middle_name = ?, email = ?, phone = ?, course = ?, year_level = ?, section = ?
       WHERE id = ?`,
      [first_name, last_name, middle_name || null, email || null, phone || null, course || null, year_level || null, section || null, params.id]
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

