import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET all violation types
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    
    const violationTypes = await query(
      'SELECT * FROM violation_types WHERE is_active = 1 ORDER BY severity, name'
    ) as any[];

    return NextResponse.json({ violation_types: violationTypes });
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

