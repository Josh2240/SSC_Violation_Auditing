'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';

interface AnalyticsData {
  totalViolations: number;
  pendingViolations: number;
  resolvedViolations: number;
  violatingStudents: number;
  monthlyData: Array<{ month: string; violations: number; students: number }>;
  departmentStats: Array<{ course: string; violations: number; students: number }>;
  topOffenders: Array<{ id: number; name: string; violationCount: number }>;
}

interface Stats {
  totalViolations: number;
  pendingViolations: number;
  resolvedViolations: number;
  totalStudents: number;
  recentViolations: any[];
}

const DEPARTMENTS = [
  { code: 'BSCRIM', name: 'Criminology' },
  { code: 'BSMT', name: 'Marine Transportation' },
  { code: 'BSIT', name: 'Information Technology' },
  { code: 'BSBA', name: 'Business Administration' },
  { code: 'BSHM', name: 'Hotel Management' },
  { code: 'BSTM', name: 'Tourism Management' },
  { code: 'BSED', name: 'Education' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [departmentCounts, setDepartmentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('yearly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDept, setSelectedDept] = useState('');

  useEffect(() => {
    fetchData();
  }, [reportType, selectedMonth, selectedDept]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [violationsRes, studentsRes, recentRes, analyticsRes, deptCountsRes] = await Promise.all([
        fetch('/api/violations?limit=1000'),
        fetch('/api/students?limit=1'),
        fetch('/api/violations?limit=10'),
        fetch(`/api/analytics?type=${reportType}${reportType === 'monthly' ? `&month=${selectedMonth}` : ''}${reportType === 'department' ? `&department=${selectedDept}` : ''}`),
        fetch('/api/students/department-counts'),
      ]);

      const violationsData = await violationsRes.json();
      const studentsData = await studentsRes.json();
      const recentData = await recentRes.json();
      const analyticsJSON = await analyticsRes.json();
      const deptCountsJSON = await deptCountsRes.json();

      const violations = violationsData.violations || [];
      const totalViolations = violations.length;
      const pendingViolations = violations.filter((v: any) => v.status === 'pending').length;
      const resolvedViolations = violations.filter((v: any) => v.status === 'resolved').length;

      setStats({
        totalViolations,
        pendingViolations,
        resolvedViolations,
        totalStudents: studentsData.pagination?.total || 0,
        recentViolations: recentData.violations || [],
      });

      // normalize department counts into a map for easy lookup
      const deptMap: Record<string, number> = {};
      if (deptCountsJSON?.data && Array.isArray(deptCountsJSON.data)) {
        deptCountsJSON.data.forEach((r: any) => {
          if (r.course) deptMap[r.course] = Number(r.student_count) || 0;
        });
      }
      setDepartmentCounts(deptMap);

      setAnalyticsData(analyticsJSON);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  const getDepartmentName = (code: string) => {
    return DEPARTMENTS.find(d => d.code === code)?.name || code;
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {/* Report Type Selector */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Report Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="yearly">Yearly Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="department">Department Report</option>
              </select>
            </div>

            {reportType === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {getMonthName(month)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {reportType === 'department' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- All Departments --</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept.code} value={dept.code}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <i className="bi bi-file-earmark-text text-2xl text-blue-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Violations</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.totalViolations || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                <i className="bi bi-clock text-2xl text-yellow-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.pendingViolations || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <i className="bi bi-check-circle text-2xl text-green-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Resolved</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.resolvedViolations || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
                <i className="bi bi-exclamation-circle text-2xl text-red-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Violating Students</p>
                <p className="text-2xl font-semibold text-gray-900">{analyticsData?.violatingStudents || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Violations Trend */}
        {reportType === 'yearly' && analyticsData?.monthlyData && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Monthly Violations Trend</h2>
            <div className="space-y-4">
              {analyticsData.monthlyData.map((data, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-16 text-sm font-medium text-gray-700">{data.month}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6">
                    <div
                      className="bg-blue-600 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                      style={{ width: `${Math.min((data.violations / 10) * 100, 100)}%` }}
                    >
                      {data.violations > 0 ? data.violations : ''}
                    </div>
                  </div>
                  <div className="w-32 text-right text-sm text-gray-600">
                    {data.violations} violations, {data.students} students
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Department Statistics */}
        {analyticsData?.departmentStats && analyticsData.departmentStats.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {reportType === 'department' ? 'Department Insights' : 'Department Breakdown'}
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Violating Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Violations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Per Student
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.departmentStats.map((dept, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getDepartmentName(dept.course)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {departmentCounts[dept.course] ?? dept.students}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dept.violations}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(dept.violations / ((departmentCounts[dept.course] ?? dept.students) || 1)).toFixed(2)}
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Violations */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Violations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Violation #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats?.recentViolations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No violations found
                    </td>
                  </tr>
                ) : (
                  stats?.recentViolations.map((violation: any) => (
                    <tr key={violation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {violation.violation_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {violation.first_name} {violation.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {violation.violation_type_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            violation.status === 'resolved'
                              ? 'bg-green-100 text-green-800'
                              : violation.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {violation.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(violation.incident_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <Link
              href="/violations"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View all violations →
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

