export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET violations report - students with violations
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    // Get all students who have at least one violation
    const sql = `
      SELECT 
        s.id,
        s.student_id,
        s.first_name,
        s.last_name,
        COUNT(v.id) as violation_count
      FROM students s
      INNER JOIN violations v ON s.id = v.student_id
      GROUP BY s.id, s.student_id, s.first_name, s.last_name
      ORDER BY s.last_name, s.first_name
    `;

    const violators = await query(sql, []) as any[];

    return NextResponse.json(violators);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching violations report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
