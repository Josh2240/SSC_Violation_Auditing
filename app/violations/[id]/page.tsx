'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import ViolationForm from '@/components/ViolationForm';

interface Violation {
  id: number;
  violation_number: string;
  student_id: number;
  student_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email?: string;
  phone?: string;
  course?: string;
  year_level?: string;
  section?: string;
  violation_type_id: number;
  violation_type_code: string;
  violation_type_name: string;
  violation_type_description?: string;
  severity: string;
  incident_date: string;
  incident_time?: string;
  location?: string;
  description: string;
  status: string;
  resolution_notes?: string;
  reported_by_name: string;
  resolved_by_name?: string;
  resolved_at?: string;
  created_at: string;
}

export default function ViolationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [violation, setViolation] = useState<Violation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    if (params.id) {
      fetchViolation();
      fetchAuditLogs();
    }
  }, [params.id]);

  const fetchViolation = async () => {
    try {
      const response = await fetch(`/api/violations/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setViolation(data.violation);
      } else {
        router.push('/violations');
      }
    } catch (error) {
      console.error('Error fetching violation:', error);
      router.push('/violations');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch(`/api/audit-logs/violations/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
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

  if (!violation) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Violation not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            <i className="bi bi-arrow-left mr-2"></i>
            Back to Violations
          </button>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Violation: {violation.violation_number}
            </h1>
            <button
              onClick={() => setShowEditForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <i className="bi bi-pencil mr-2"></i>
              Edit
            </button>
          </div>
        </div>

        {showEditForm && (
          <ViolationForm
            violation={violation}
            onClose={() => {
              setShowEditForm(false);
              fetchViolation();
            }}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Violation Details</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Violation Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{violation.violation_number}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        violation.status
                      )}`}
                    >
                      {violation.status.replace('_', ' ')}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Violation Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{violation.violation_type_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Severity</dt>
                  <dd className="mt-1">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(
                        violation.severity
                      )}`}
                    >
                      {violation.severity}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Incident Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(violation.incident_date).toLocaleDateString()}
                  </dd>
                </div>
                {violation.incident_time && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Incident Time</dt>
                    <dd className="mt-1 text-sm text-gray-900">{violation.incident_time}</dd>
                  </div>
                )}
                {violation.location && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Location</dt>
                    <dd className="mt-1 text-sm text-gray-900">{violation.location}</dd>
                  </div>
                )}
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{violation.description}</dd>
                </div>
                {violation.resolution_notes && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Resolution Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{violation.resolution_notes}</dd>
                  </div>
                )}
              </dl>
            </div>

            {auditLogs.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Audit Trail</h2>
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {log.action} by {log.full_name || log.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Student ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{violation.student_number}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {violation.first_name} {violation.middle_name} {violation.last_name}
                  </dd>
                </div>
                {violation.course && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Course</dt>
                    <dd className="mt-1 text-sm text-gray-900">{violation.course}</dd>
                  </div>
                )}
                {violation.year_level && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Year Level</dt>
                    <dd className="mt-1 text-sm text-gray-900">{violation.year_level}</dd>
                  </div>
                )}
                {violation.section && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Section</dt>
                    <dd className="mt-1 text-sm text-gray-900">{violation.section}</dd>
                  </div>
                )}
                {violation.email && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{violation.email}</dd>
                  </div>
                )}
                {violation.phone && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{violation.phone}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Reported By</dt>
                  <dd className="mt-1 text-sm text-gray-900">{violation.reported_by_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Reported On</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(violation.created_at).toLocaleString()}
                  </dd>
                </div>
                {violation.resolved_by_name && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Resolved By</dt>
                      <dd className="mt-1 text-sm text-gray-900">{violation.resolved_by_name}</dd>
                    </div>
                    {violation.resolved_at && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Resolved On</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(violation.resolved_at).toLocaleString()}
                        </dd>
                      </div>
                    )}
                  </>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

