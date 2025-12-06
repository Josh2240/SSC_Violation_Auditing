'use client';

import { useState, useEffect, FormEvent } from 'react';

interface ViolationType {
  id: number;
  code: string;
  name: string;
  severity: string;
}

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
}

interface Violation {
  id?: number;
  student_id?: number;
  violation_type_id?: number;
  incident_date?: string;
  incident_time?: string;
  location?: string;
  description?: string;
  status?: string;
  resolution_notes?: string;
}

interface ViolationFormProps {
  violation?: Violation | null;
  onClose: () => void;
}

export default function ViolationForm({ violation, onClose }: ViolationFormProps) {
  const [formData, setFormData] = useState({
    student_id: '',
    violation_type_id: '',
    incident_date: '',
    incident_time: '',
    location: '',
    description: '',
    status: 'pending',
    resolution_notes: '',
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchStudent, setSearchStudent] = useState('');

  useEffect(() => {
    fetchViolationTypes();
    if (violation) {
      setFormData({
        student_id: violation.student_id?.toString() || '',
        violation_type_id: violation.violation_type_id?.toString() || '',
        incident_date: violation.incident_date || '',
        incident_time: violation.incident_time || '',
        location: violation.location || '',
        description: violation.description || '',
        status: violation.status || 'pending',
        resolution_notes: violation.resolution_notes || '',
      });
    }
  }, [violation]);

  useEffect(() => {
    if (searchStudent.length >= 2) {
      fetchStudents();
    } else {
      setStudents([]);
    }
  }, [searchStudent]);

  const fetchViolationTypes = async () => {
    try {
      const response = await fetch('/api/violation-types');
      const data = await response.json();
      setViolationTypes(data.violation_types || []);
    } catch (error) {
      console.error('Error fetching violation types:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/students?search=${encodeURIComponent(searchStudent)}&limit=10`);
      const data = await response.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = violation ? `/api/violations/${violation.id}` : '/api/violations';
      const method = violation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          student_id: parseInt(formData.student_id),
          violation_type_id: parseInt(formData.violation_type_id),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onClose();
      } else {
        setError(data.error || 'Failed to save violation');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {violation ? 'Edit Violation' : 'Report New Violation'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student *
                </label>
                {violation ? (
                  <input
                    type="text"
                    value={formData.student_id}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Search student by ID or name..."
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {students.length > 0 && (
                      <div className="mt-1 border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                        {students.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, student_id: student.id.toString() });
                              setSearchStudent(`${student.student_id} - ${student.first_name} ${student.last_name}`);
                              setStudents([]);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                          >
                            {student.student_id} - {student.first_name} {student.last_name}
                          </button>
                        ))}
                      </div>
                    )}
                    <input
                      type="hidden"
                      value={formData.student_id}
                      required
                    />
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Violation Type *
                </label>
                <select
                  value={formData.violation_type_id}
                  onChange={(e) => setFormData({ ...formData, violation_type_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select violation type</option>
                  {violationTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.code} - {type.name} ({type.severity})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Incident Date *
                </label>
                <input
                  type="date"
                  value={formData.incident_date}
                  onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Incident Time
                </label>
                <input
                  type="time"
                  value={formData.incident_time}
                  onChange={(e) => setFormData({ ...formData, incident_time: e.target.value })}
                  className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Where did the incident occur?"
                className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                placeholder="Describe the violation in detail..."
                className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {violation && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
              </div>
            )}

            {violation && formData.status === 'resolved' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resolution Notes
                </label>
                <textarea
                  value={formData.resolution_notes}
                  onChange={(e) => setFormData({ ...formData, resolution_notes: e.target.value })}
                  rows={3}
                  placeholder="Enter resolution details..."
                  className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : violation ? 'Update' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

