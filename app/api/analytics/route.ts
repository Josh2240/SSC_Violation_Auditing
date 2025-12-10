import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('type') || 'overview'; // overview, monthly, yearly, department
    const month = searchParams.get('month') || '';
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    let analytics: any = {};

    // Overview statistics
    if (reportType === 'overview' || reportType === 'yearly') {
      const yearViolations = await query(
        `SELECT 
          COUNT(DISTINCT student_id) as violating_students,
          COUNT(*) as total_violations,
          COUNT(DISTINCT DATE_FORMAT(created_at, '%Y-%m')) as active_months,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
          COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
          COUNT(CASE WHEN status = 'dismissed' THEN 1 END) as dismissed
         FROM violations 
         WHERE YEAR(created_at) = ?`,
        [parseInt(year)]
      ) as any[];

      // Violations by department
      const byDepartment = await query(
        `SELECT 
          s.course,
          COUNT(DISTINCT v.student_id) as violating_students,
          COUNT(v.id) as total_violations,
          COUNT(DISTINCT v.student_id) as unique_students
         FROM violations v
         LEFT JOIN students s ON v.student_id = s.id
         WHERE YEAR(v.created_at) = ?
         GROUP BY s.course
         ORDER BY total_violations DESC`,
        [parseInt(year)]
      ) as any[];

      // Monthly data for chart
      const monthlyData = await query(
        `SELECT 
          DATE_FORMAT(created_at, '%m') as month,
          COUNT(DISTINCT student_id) as violating_students,
          COUNT(*) as violations
         FROM violations
         WHERE YEAR(created_at) = ?
         GROUP BY DATE_FORMAT(created_at, '%m')
         ORDER BY month ASC`,
        [parseInt(year)]
      ) as any[];

      analytics = {
        reportType: 'yearly',
        year,
        stats: yearViolations[0] || {},
        byDepartment,
        monthlyData: formatMonthlyData(monthlyData),
      };
    }

    // Monthly report
    if (reportType === 'monthly' && month) {
      const [monthNum, monthYear] = month.split('-');
      
      const monthViolations = await query(
        `SELECT 
          COUNT(DISTINCT student_id) as violating_students,
          COUNT(*) as total_violations,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
          COUNT(CASE WHEN offense_count = 1 THEN 1 END) as first_offense,
          COUNT(CASE WHEN offense_count = 2 THEN 1 END) as second_offense,
          COUNT(CASE WHEN offense_count = 3 THEN 1 END) as third_offense
         FROM violations 
         WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?`,
        [parseInt(monthNum), parseInt(monthYear)]
      ) as any[];

      // Daily data for month
      const dailyData = await query(
        `SELECT 
          DATE_FORMAT(created_at, '%d') as day,
          COUNT(DISTINCT student_id) as violating_students,
          COUNT(*) as violations
         FROM violations
         WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
         GROUP BY DATE_FORMAT(created_at, '%d')
         ORDER BY day ASC`,
        [parseInt(monthNum), parseInt(monthYear)]
      ) as any[];

      // By department for this month
      const byDept = await query(
        `SELECT 
          s.course,
          COUNT(DISTINCT v.student_id) as violating_students,
          COUNT(v.id) as violations
         FROM violations v
         LEFT JOIN students s ON v.student_id = s.id
         WHERE MONTH(v.created_at) = ? AND YEAR(v.created_at) = ?
         GROUP BY s.course
         ORDER BY violations DESC`,
        [parseInt(monthNum), parseInt(monthYear)]
      ) as any[];

      analytics = {
        reportType: 'monthly',
        month,
        stats: monthViolations[0] || {},
        byDepartment: byDept,
        dailyData,
      };
    }

    // Department report
    if (reportType === 'department') {
      const dept = searchParams.get('department') || '';
      
      if (dept) {
        const deptStats = await query(
          `SELECT 
            COUNT(DISTINCT v.student_id) as violating_students,
            COUNT(v.id) as total_violations,
            COUNT(CASE WHEN v.status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN v.status = 'resolved' THEN 1 END) as resolved
           FROM violations v
           LEFT JOIN students s ON v.student_id = s.id
           WHERE s.course = ? AND YEAR(v.created_at) = ?`,
          [dept, parseInt(year)]
        ) as any[];

        // Top offenders in department
        const topOffenders = await query(
          `SELECT 
            s.id,
            s.student_id,
            s.first_name,
            s.last_name,
            COUNT(v.id) as violation_count,
            MAX(v.offense_count) as max_offense
           FROM violations v
           LEFT JOIN students s ON v.student_id = s.id
           WHERE s.course = ? AND YEAR(v.created_at) = ?
           GROUP BY s.id
           ORDER BY violation_count DESC
           LIMIT 10`,
          [dept, parseInt(year)]
        ) as any[];

        analytics = {
          reportType: 'department',
          department: dept,
          year,
          stats: deptStats[0] || {},
          topOffenders,
        };
      }
    }

    return NextResponse.json(analytics);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatMonthlyData(data: any[]) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const formatted = months.map((month, index) => {
    const monthData = data.find((d: any) => parseInt(d.month) === index + 1);
    return {
      month,
      violating_students: monthData?.violating_students || 0,
      violations: monthData?.violations || 0,
    };
  });
  
  return formatted;
}
