import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const rows = await query(`
      SELECT course, COUNT(*) as student_count
      FROM students
      GROUP BY course
    `);

    return NextResponse.json({ data: rows });
  } catch (err: any) {
    console.error('Error fetching department student counts:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
