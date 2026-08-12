'use client';

import AddUserModal from './AddUserModal';
import EditUserModal from "./EditUserModal";
import DeleteUserModal from "./DeleteUserModal";
import ResetPasswordModal from "./ResetPasswordModal";
import Layout from '@/components/Layout';
import { useEffect, useMemo, useState } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'staff';
  is_active: number;
  created_at: string;
  updated_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] =useState(false);
  const [showDeleteModal, setShowDeleteModal] =useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');

  //----------------------------------------
  // ADD FORM
  //----------------------------------------

  const [addForm,setAddForm]=useState({
      username:'',
      full_name:'',
      email:'',
      password:'',
      confirmPassword:'',
      role:'staff'
  });

  //----------------------------------------
  // EDIT FORM
  //----------------------------------------

  const [editForm,setEditForm]=useState({
      full_name:'',
      email:'',
      role:'staff'
  });

  //----------------------------------------
  // PASSWORD FORM
  //----------------------------------------

  const [passwordForm,setPasswordForm]=useState({
      password:'',
      confirmPassword:''
  });

  //----------------------------------------
// LOAD USERS
//----------------------------------------

async function loadUsers() {
  try {
    setLoading(true);
    setError("");

    const res = await fetch("/api/users");

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to load users");
    }

    setUsers(data.users);
  } catch (err: any) {
    console.error(err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
}

  useEffect(()=>{

      loadUsers();

  },[]);

  //----------------------------------------
  // SEARCH
  //----------------------------------------

  const filteredUsers=useMemo(()=>{

      return users.filter(user=>{

          const term=search.toLowerCase();

          return(

              user.username.toLowerCase().includes(term) ||

              user.full_name.toLowerCase().includes(term) ||

              user.email.toLowerCase().includes(term) ||

              user.role.toLowerCase().includes(term)

          );

      });

  },[users,search]);

  //----------------------------------------
  // OPEN EDIT
  //----------------------------------------

  function openEdit(user:User){

      setSelectedUser(user);

      setEditForm({

          full_name:user.full_name,

          email:user.email,

          role:user.role

      });

      setShowEditModal(true);

  }

  //----------------------------------------

  function openDelete(user:User){

      setSelectedUser(user);

      setShowDeleteModal(true);

  }

  //----------------------------------------

  function openPassword(user:User){

      setSelectedUser(user);

      setPasswordForm({

          password:'',

          confirmPassword:''

      });

      setShowPasswordModal(true);

  }

  //----------------------------------------

  return (

<Layout>

<div className="container py-4">

    {/* HEADER */}
    <div className="d-flex justify-content-between align-items-center mb-4">

        <h1 className="fw-bold mb-0">
            User Management
        </h1>

        <button
            className="btn btn-primary px-4"
            onClick={() => setShowAddModal(true)}
        >
            <i className="bi bi-person-plus me-2"></i>
            Add User
        </button>

    </div>

    {/* ALERTS */}

    {success && (
        <div className="alert alert-success">
            {success}
        </div>
    )}

    {error && (
        <div className="alert alert-danger">
            {error}
        </div>
    )}

    {/* SEARCH CARD */}

    <div className="card shadow-sm border-0 rounded-4 mb-4">

        <div className="card-body">

            <input
                className="form-control form-control-lg"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

        </div>

    </div>

    {/* TABLE CARD */}

    <div className="card shadow-sm border-0 rounded-4">

        <div className="card-body p-0">

            {loading ? (

                <div className="text-center py-5">

                    <div className="spinner-border text-primary"></div>

                </div>

            ) : (

                <table className="table align-middle mb-0">

                    <thead>

                        <tr>

                            <th>Username</th>

                            <th>Full Name</th>

                            <th>Email</th>

                            <th>Role</th>

                            <th>Status</th>

                            <th className="text-center">Actions</th>

                        </tr>

                    </thead>

                    <tbody>

                        {filteredUsers.map(user => (

                            <tr key={user.id}>

                                <td>{user.username}</td>

                                <td>{user.full_name}</td>

                                <td>{user.email}</td>

                                <td>

                                    <span
                                        className={`badge ${
                                            user.role === "admin"
                                                ? "bg-danger"
                                                : "bg-primary"
                                        }`}
                                    >
                                        {user.role}
                                    </span>

                                </td>

                                <td>

                                    {user.is_active ? (

                                        <span className="badge bg-success">
                                            Active
                                        </span>

                                    ) : (

                                        <span className="badge bg-secondary">
                                            Inactive
                                        </span>

                                    )}

                                </td>

                                <td className="text-center">

                                    <button
                                        className="btn btn-link text-primary"
                                        onClick={() => openEdit(user)}
                                    >
                                        <i className="bi bi-pencil"></i>
                                    </button>

                                    <button
                                        className="btn btn-link text-warning"
                                        onClick={() => openPassword(user)}
                                    >
                                        <i className="bi bi-key"></i>
                                    </button>

                                    <button
                                        className="btn btn-link text-danger"
                                        onClick={() => openDelete(user)}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </button>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            )}

        </div>

    </div>



    {/* MODALS */}

      <AddUserModal
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
              setShowAddModal(false);
              setSuccess("User created successfully.");
              loadUsers();
          }}
      />

      {selectedUser && (
          <EditUserModal
              show={showEditModal}
              user={selectedUser}
              onClose={() => setShowEditModal(false)}
              onSuccess={() => {
                  setShowEditModal(false);
                  setSuccess("User updated successfully.");
                  loadUsers();
              }}
          />
      )}

      {selectedUser && (
          <ResetPasswordModal
              show={showPasswordModal}
              user={selectedUser}
              onClose={() => setShowPasswordModal(false)}
              onSuccess={() => {
                  setShowPasswordModal(false);
                  setSuccess("Password reset successfully.");
              }}
          />
      )}

      {selectedUser && (
          <DeleteUserModal
              show={showDeleteModal}
              user={selectedUser}
              onClose={() => setShowDeleteModal(false)}
              onSuccess={() => {
                  setShowDeleteModal(false);
                  setSuccess("User deleted successfully.");
                  loadUsers();
              }}
          />
        )}

      </div>
    </Layout>
  );

}