import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

// GET single violation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);
    
    const violations = await query(
      `SELECT v.*, 
       s.student_id as student_number, s.first_name, s.last_name, s.middle_name, s.email, s.phone, s.course, s.year_level, s.section,
       vt.code as violation_type_code, vt.name as violation_type_name, vt.description as violation_type_description, vt.severity,
       u1.full_name as reported_by_name, u1.username as reported_by_username,
       u2.full_name as resolved_by_name, u2.username as resolved_by_username
       FROM violations v
       LEFT JOIN students s ON v.student_id = s.id
       LEFT JOIN violation_types vt ON v.violation_type_id = vt.id
       LEFT JOIN users u1 ON v.reported_by = u1.id
       LEFT JOIN users u2 ON v.resolved_by = u2.id
       WHERE v.id = ?`,
      [params.id]
    ) as any[];
    
    if (violations.length === 0) {
      return NextResponse.json(
        { error: 'Violation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ violation: violations[0] });
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

// PUT update violation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const data = await request.json();

    // Get old values
    const oldViolation = await query('SELECT * FROM violations WHERE id = ?', [params.id]) as any[];
    if (oldViolation.length === 0) {
      return NextResponse.json(
        { error: 'Violation not found' },
        { status: 404 }
      );
    }

    const { violation_type_id, incident_date, incident_time, location, description, status, resolution_notes } = data;

    // If status is being changed to resolved, set resolved_by and resolved_at
    let resolvedBy = oldViolation[0].resolved_by;
    let resolvedAt = oldViolation[0].resolved_at;
    
    if (status === 'resolved' && oldViolation[0].status !== 'resolved') {
      resolvedBy = user.id;
      resolvedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    } else if (status !== 'resolved' && oldViolation[0].status === 'resolved') {
      resolvedBy = null;
      resolvedAt = null;
    }

    await query(
      `UPDATE violations 
       SET violation_type_id = ?, incident_date = ?, incident_time = ?, location = ?, 
           description = ?, status = ?, resolution_notes = ?, resolved_by = ?, resolved_at = ?
       WHERE id = ?`,
      [
        violation_type_id || oldViolation[0].violation_type_id,
        incident_date || oldViolation[0].incident_date,
        incident_time !== undefined ? incident_time : oldViolation[0].incident_time,
        location !== undefined ? location : oldViolation[0].location,
        description || oldViolation[0].description,
        status || oldViolation[0].status,
        resolution_notes !== undefined ? resolution_notes : oldViolation[0].resolution_notes,
        resolvedBy,
        resolvedAt,
        params.id,
      ]
    );

    // Create audit log
    await createAuditLog({
      table_name: 'violations',
      record_id: parseInt(params.id),
      action: 'UPDATE',
      user_id: user.id,
      old_values: oldViolation[0],
      new_values: { ...data, resolved_by: resolvedBy, resolved_at: resolvedAt },
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

// DELETE violation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    // Get old values for audit log before deletion
    const oldViolation = await query('SELECT * FROM violations WHERE id = ?', [params.id]) as any[];
    if (oldViolation.length === 0) {
      return NextResponse.json(
        { error: 'Violation not found' },
        { status: 404 }
      );
    }

    // Delete the violation
    await query('DELETE FROM violations WHERE id = ?', [params.id]);

    // Create audit log
    await createAuditLog({
      table_name: 'violations',
      record_id: parseInt(params.id),
      action: 'DELETE',
      user_id: user.id,
      old_values: oldViolation[0],
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Delete violation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

