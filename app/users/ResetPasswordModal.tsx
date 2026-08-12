'use client';

import { useState } from 'react';

interface User {
  id: number;
  username: string;
}

interface Props {
  show: boolean;
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ResetPasswordModal({
  show,
  user,
  onClose,
  onSuccess,
}: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!show) return null;

  async function resetPassword() {
    try {
      setSaving(true);
      setError('');

      if (!password.trim())
        throw new Error('Password is required.');

      if (password.length < 6)
        throw new Error('Password must be at least 6 characters.');

      if (password !== confirmPassword)
        throw new Error('Passwords do not match.');

      const res = await fetch(
        `/api/users/${user.id}/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setPassword('');
      setConfirmPassword('');

      onSuccess();
      onClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        className="modal fade show"
        style={{
          display: 'block',
          background: 'rgba(0,0,0,.5)',
        }}
      >
        <div className="modal-dialog">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">
                Reset Password
              </h5>

              <button
                className="btn-close"
                onClick={onClose}
              />
            </div>

            <div className="modal-body">

              <p>
                Reset password for
                <strong> {user.username}</strong>
              </p>

              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">
                  New Password
                </label>

                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Confirm Password
                </label>

                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                />
              </div>

            </div>

            <div className="modal-footer">

              <button
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                disabled={saving}
                onClick={resetPassword}
              >
                {saving
                  ? 'Saving...'
                  : 'Reset Password'}
              </button>

            </div>

          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>
  );
}