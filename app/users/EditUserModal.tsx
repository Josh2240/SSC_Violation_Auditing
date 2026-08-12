'use client';

import { useEffect, useState } from "react";

interface User {
  id: number;
  full_name: string;
  email: string;
  role: "admin" | "staff";
}

interface Props {
  show: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditUserModal({
  show,
  user,
  onClose,
  onSuccess,
}: Props) {

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    role: "staff",
  });

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      });
    }
  }, [user]);

  if (!show || !user) return null;

  async function save() {

    try {

      setLoading(true);

      const res = await fetch(`/api/users/${user!.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      onSuccess();

      onClose();

    } catch (err: any) {

      alert(err.message);

    } finally {

      setLoading(false);

    }

  }

  return (

<div className="modal d-block" tabIndex={-1}>

<div className="modal-dialog">

<div className="modal-content">

<div className="modal-header">

<h5>Edit User</h5>

<button
className="btn-close"
onClick={onClose}
/>

</div>

<div className="modal-body">

<div className="mb-3">

<label>Full Name</label>

<input
className="form-control"
value={form.full_name}
onChange={(e)=>
setForm({
...form,
full_name:e.target.value
})
}
/>

</div>

<div className="mb-3">

<label>Email</label>

<input
className="form-control"
value={form.email}
onChange={(e)=>
setForm({
...form,
email:e.target.value
})
}
/>

</div>

<div className="mb-3">

<label>Role</label>

<select
className="form-select"
value={form.role}
onChange={(e)=>
setForm({
...form,
role:e.target.value as "admin" | "staff"
})
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

<div className="modal-footer">

<button
className="btn btn-secondary"
onClick={onClose}
>

Cancel

</button>

<button
className="btn btn-primary"
onClick={save}
disabled={loading}
>

{loading ? "Saving..." : "Save"}

</button>

</div>

</div>

</div>

</div>

  );

}