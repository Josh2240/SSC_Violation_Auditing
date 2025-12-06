import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAuditLogs } from '@/lib/audit';

// GET audit logs for a specific record
export async function GET(
  request: NextRequest,
  { params }: { params: { table: string; id: string } }
) {
  try {
    await requireAuth(request);
    
    const logs = await getAuditLogs(params.table, parseInt(params.id));

    return NextResponse.json({ logs });
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

