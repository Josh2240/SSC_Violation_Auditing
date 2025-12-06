import { query } from './db';
import { UserPayload } from './auth';

export interface AuditLogData {
  table_name: string;
  record_id: number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  user_id: number;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
}

// Create audit log entry
export async function createAuditLog(
  data: AuditLogData
): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs 
       (table_name, record_id, action, user_id, old_values, new_values, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.table_name,
        data.record_id,
        data.action,
        data.user_id,
        data.old_values ? JSON.stringify(data.old_values) : null,
        data.new_values ? JSON.stringify(data.new_values) : null,
        data.ip_address || null,
        data.user_agent || null,
      ]
    );
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main operation
  }
}

// Get audit logs for a specific record
export async function getAuditLogs(
  tableName: string,
  recordId: number,
  limit: number = 50
): Promise<any[]> {
  const logs = await query(
    `SELECT al.*, u.username, u.full_name 
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     WHERE al.table_name = ? AND al.record_id = ?
     ORDER BY al.created_at DESC
     LIMIT ?`,
    [tableName, recordId, limit]
  ) as any[];
  
  return logs.map(log => ({
    ...log,
    old_values: log.old_values ? JSON.parse(log.old_values) : null,
    new_values: log.new_values ? JSON.parse(log.new_values) : null,
  }));
}

// Get all audit logs with filters
export async function getAllAuditLogs(
  filters: {
    table_name?: string;
    user_id?: number;
    action?: string;
    start_date?: string;
    end_date?: string;
  },
  limit: number = 100,
  offset: number = 0
): Promise<any[]> {
  let sql = `SELECT al.*, u.username, u.full_name 
             FROM audit_logs al
             LEFT JOIN users u ON al.user_id = u.id
             WHERE 1=1`;
  const params: any[] = [];

  if (filters.table_name) {
    sql += ' AND al.table_name = ?';
    params.push(filters.table_name);
  }
  if (filters.user_id) {
    sql += ' AND al.user_id = ?';
    params.push(filters.user_id);
  }
  if (filters.action) {
    sql += ' AND al.action = ?';
    params.push(filters.action);
  }
  if (filters.start_date) {
    sql += ' AND al.created_at >= ?';
    params.push(filters.start_date);
  }
  if (filters.end_date) {
    sql += ' AND al.created_at <= ?';
    params.push(filters.end_date);
  }

  sql += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const logs = await query(sql, params) as any[];
  
  return logs.map(log => ({
    ...log,
    old_values: log.old_values ? JSON.parse(log.old_values) : null,
    new_values: log.new_values ? JSON.parse(log.new_values) : null,
  }));
}

