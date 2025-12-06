import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getAllAuditLogs } from '@/lib/audit';

// GET audit logs (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'staff']);
    
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      table_name: searchParams.get('table_name') || undefined,
      user_id: searchParams.get('user_id') ? parseInt(searchParams.get('user_id')!) : undefined,
      action: searchParams.get('action') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
    };
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const logs = await getAllAuditLogs(filters, limit, offset);

    return NextResponse.json({ logs });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('Forbidden') ? 403 : 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

