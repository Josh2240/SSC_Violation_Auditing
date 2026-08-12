'use client';

import { useEffect, useState } from 'react';

interface Props {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddUserModal({
  show,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (!show) {
      setForm({
        username: '',
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'staff',
      });

      setError('');
      setLoading(false);
    }
  }, [show]);

  if (!show) return null;

  const update = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  async function save() {
    setError('');

    if (!form.username.trim())
      return setError('Username is required.');

    if (!form.full_name.trim())
      return setError('Full name is required.');

    if (!form.email.trim())
      return setError('Email is required.');

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(form.email))
      return setError('Invalid email address.');

    if (!form.password)
      return setError('Password is required.');

    if (form.password.length < 6)
      return setError(
        'Password must be at least 6 characters.'
      );

    if (form.password !== form.confirmPassword)
      return setError('Passwords do not match.');

    try {
      setLoading(true);

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: form.username,
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="modal fade show d-block">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-person-plus-fill me-2"></i>
                Add User
              </h5>

              <button
                className="btn-close"
                onClick={onClose}
              />
            </div>

            <div className="modal-body">

              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              <div className="row g-3">

                <div className="col-md-6">
                  <label className="form-label">
                    Username
                  </label>

                  <input
                    className="form-control"
                    value={form.username}
                    onChange={(e) =>
                      update('username', e.target.value)
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Full Name
                  </label>

                  <input
                    className="form-control"
                    value={form.full_name}
                    onChange={(e) =>
                      update('full_name', e.target.value)
                    }
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">
                    Email
                  </label>

                  <input
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={(e) =>
                      update('email', e.target.value)
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Password
                  </label>

                  <input
                    type="password"
                    className="form-control"
                    value={form.password}
                    onChange={(e) =>
                      update('password', e.target.value)
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    className="form-control"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      update(
                        'confirmPassword',
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">
                    Role
                  </label>

                  <select
                    className="form-select"
                    value={form.role}
                    onChange={(e) =>
                      update('role', e.target.value)
                    }
                  >
                    <option value="staff">
                      Staff
                    </option>

                    <option value="admin">
                      Administrator
                    </option>
                  </select>
                </div>

              </div>

            </div>

            <div className="modal-footer">

              <button
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                onClick={save}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-2"></i>
                    Create User
                  </>
                )}
              </button>

            </div>

          </div>
        </div>
      </div>

      <div
        className="modal-backdrop fade show"
        onClick={onClose}
      />
    </>
  );
}