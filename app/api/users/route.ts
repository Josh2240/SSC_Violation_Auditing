import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole, hashPassword } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

// =========================================
// GET ALL USERS
// =========================================

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);

    const users = await query(
      `
      SELECT
        id,
        username,
        email,
        full_name,
        role,
        is_active,
        created_at,
        updated_at
      FROM users
      ORDER BY full_name ASC
      `
    ) as any[];

    return NextResponse.json({
      success: true,
      users,
    });

  } catch (error: any) {
    console.error("GET USERS ERROR:", error);

    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      {
        status:
          error.message === "Unauthorized"
            ? 401
            : error.message?.includes("Forbidden")
            ? 403
            : 500,
      }
    );
  }
}

// =========================================
// CREATE USER
// =========================================

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(request, ["admin"]);

    const body = await request.json();

    const {
      username,
      password,
      email,
      full_name,
      role,
    } = body;

    if (!username?.trim()) {
      return NextResponse.json(
        { error: "Username is required." },
        { status: 400 }
      );
    }

    if (!full_name?.trim()) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    if (!password?.trim()) {
      return NextResponse.json(
        { error: "Password is required." },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { error: "Role is required." },
        { status: 400 }
      );
    }

    if (!["admin", "staff"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role." },
        { status: 400 }
      );
    }

    const usernameExists = await query(
      "SELECT id FROM users WHERE username=?",
      [username.trim()]
    ) as any[];

    if (usernameExists.length > 0) {
      return NextResponse.json(
        { error: "Username already exists." },
        { status: 400 }
      );
    }

    const emailExists = await query(
      "SELECT id FROM users WHERE email=?",
      [email.trim()]
    ) as any[];

    if (emailExists.length > 0) {
      return NextResponse.json(
        { error: "Email already exists." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const result: any = await query(
      `
      INSERT INTO users
      (
        username,
        email,
        password_hash,
        full_name,
        role,
        is_active
      )
      VALUES
      (?, ?, ?, ?, ?, 1)
      `,
      [
        username.trim(),
        email.trim(),
        passwordHash,
        full_name.trim(),
        role,
      ]
    );

    await createAuditLog({
      table_name: "users",
      record_id: result.insertId,
      action: "INSERT",
      user_id: admin.id,
      new_values: {
        username,
        email,
        full_name,
        role,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User created successfully.",
      id: result.insertId,
    });

  } catch (error: any) {
    console.error("CREATE USER ERROR:", error);

    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      {
        status:
          error.message === "Unauthorized"
            ? 401
            : error.message?.includes("Forbidden")
            ? 403
            : 500,
      }
    );
  }
}