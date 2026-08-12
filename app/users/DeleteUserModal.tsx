'use client';

import { useState } from "react";

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

export default function DeleteUserModal({
  show,
  user,
  onClose,
  onSuccess,
}: Props) {

  const [loading, setLoading] = useState(false);

  if (!show) return null;

  async function removeUser() {

    try {

      setLoading(true);

      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      onSuccess();

    } catch (err: any) {

      alert(err.message);

    } finally {

      setLoading(false);

    }

  }

  return (
    <>
      <div
        className="modal fade show"
        style={{
          display: "block",
          background: "rgba(0,0,0,.5)",
        }}
      >
        <div className="modal-dialog">

          <div className="modal-content">

            <div className="modal-header">

              <h5 className="modal-title">
                Delete User
              </h5>

              <button
                className="btn-close"
                onClick={onClose}
              />

            </div>

            <div className="modal-body">

              <p>
                Delete
                <strong> {user.username}</strong>?
              </p>

              <div className="alert alert-danger mb-0">
                This action cannot be undone.
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
                className="btn btn-danger"
                disabled={loading}
                onClick={removeUser}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>

            </div>

          </div>

        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>
  );
}