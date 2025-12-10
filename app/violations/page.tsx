'use client';

import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import ViolationForm from '@/components/ViolationForm';
import Link from 'next/link';

interface Violation {
  id: number;
  violation_number: string;
  student_id: number;
  student_number: string;
  first_name: string;
  last_name: string;
  violation_type_name: string;
  severity: string;
  incident_date: string;
  status: string;
  reported_by_name: string;
  offense_count?: number;
}

export default function ViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [departmentCounts, setDepartmentCounts] = useState<Record<string, number>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingViolation, setEditingViolation] = useState<Violation | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; violation: Violation | null }>({
    show: false,
    violation: null,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchViolations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (debouncedSearch.trim()) {
        params.append('search', debouncedSearch.trim());
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      if (courseFilter) {
        params.append('course', courseFilter);
      }

      const response = await fetch(`/api/violations?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch violations');
      }
      const data = await response.json();
      setViolations(data.violations || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching violations:', error);
      setViolations([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, courseFilter, page]);

  useEffect(() => {
    fetchViolations();
  }, [fetchViolations]);

  useEffect(() => {
    // fetch students per department to show counts in the course dropdown
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/students/department-counts');
        if (!res.ok) return;
        const json = await res.json();
        const map: Record<string, number> = {};
        if (json?.data && Array.isArray(json.data)) {
          json.data.forEach((r: any) => {
            if (r.course) map[r.course] = Number(r.student_count) || 0;
          });
        }
        if (mounted) setDepartmentCounts(map);
      } catch (err) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleEdit = (violation: Violation) => {
    setEditingViolation(violation);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingViolation(null);
    fetchViolations();
  };

  const handleDelete = async (violation: Violation) => {
    try {
      const response = await fetch(`/api/violations/${violation.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete violation');
      }

      // Close confirmation dialog
      setDeleteConfirm({ show: false, violation: null });
      
      // Refresh violations list
      fetchViolations();
    } catch (error: any) {
      console.error('Error deleting violation:', error);
      alert(error.message || 'Failed to delete violation');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'major':
        return 'bg-orange-100 text-orange-800';
      case 'minor':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Violations</h1>
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 text-sm sm:text-base font-medium touch-target"
          >
            <i className="bi bi-plus-circle mr-2"></i>
            Report Violation
          </button>
        </div>

        <div className="bg-white rounded-lg shadow mb-6 p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Search by violation # or student..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm touch-target"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm touch-target"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm touch-target"
            >
              <option value="">All Departments</option>
              <option value="BSCRIM">BSCRIM ({departmentCounts['BSCRIM'] ?? 0})</option>
              <option value="BSMT">BSMT ({departmentCounts['BSMT'] ?? 0})</option>
              <option value="BSIT">BSIT ({departmentCounts['BSIT'] ?? 0})</option>
              <option value="BSBA">BSBA ({departmentCounts['BSBA'] ?? 0})</option>
              <option value="BSHM">BSHM ({departmentCounts['BSHM'] ?? 0})</option>
              <option value="BSTM">BSTM ({departmentCounts['BSTM'] ?? 0})</option>
              <option value="BSED">BSED ({departmentCounts['BSED'] ?? 0})</option>
            </select>
          </div>
        </div>

        {showForm && (
          <ViolationForm
            violation={editingViolation}
            onClose={handleFormClose}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirm.show && deleteConfirm.violation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm Deletion
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete violation{' '}
                <span className="font-semibold">{deleteConfirm.violation.violation_number}</span>?
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm({ show: false, violation: null })}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.violation!)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
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
                        Offense #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reported By
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {violations.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                          No violations found
                        </td>
                      </tr>
                    ) : (
                      violations.map((violation) => (
                        <tr key={violation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <Link
                              href={`/violations/${violation.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {violation.violation_number}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {violation.first_name} {violation.last_name}
                            <br />
                            <span className="text-xs text-gray-400">{violation.student_number}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {violation.violation_type_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ${
                                violation.offense_count === 3
                                  ? 'bg-red-100 text-red-800'
                                  : violation.offense_count === 2
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              #{violation.offense_count || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(
                                violation.severity
                              )}`}
                            >
                              {violation.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(violation.incident_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                violation.status
                              )}`}
                            >
                              {violation.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {violation.reported_by_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEdit(violation)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit violation"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ show: true, violation })}
                                className="text-red-600 hover:text-red-900"
                                title="Delete violation"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

