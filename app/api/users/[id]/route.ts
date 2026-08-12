import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

//
// UPDATE USER
//
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireRole(request, ["admin"]);

    const body = await request.json();

    await query(
      `
      UPDATE users
      SET
        full_name = ?,
        email = ?,
        role = ?
      WHERE id = ?
      `,
      [
        body.full_name,
        body.email,
        body.role,
        params.id,
      ]
    );

    await createAuditLog({
      table_name: "users",
      record_id: Number(params.id),
      action: "UPDATE",
      user_id: admin.id,
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}

//
// DELETE USER
//
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireRole(request, ["admin"]);

    await query(
      `
      DELETE FROM users
      WHERE id = ?
      `,
      [params.id]
    );

    await createAuditLog({
      table_name: "users",
      record_id: Number(params.id),
      action: "DELETE",
      user_id: admin.id,
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}