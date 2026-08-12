import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole, hashPassword } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireRole(request, ["admin"]);

    const body = await request.json();

    if (!body.password?.trim()) {
      return NextResponse.json(
        { error: "Password is required." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(body.password);
    console.log("DB:", process.env.DB_NAME);
    console.log("Resetting user:", params.id);
    console.log("New password:", body.password);
    const result: any = await query(
  `
  UPDATE users
  SET password_hash = ?
  WHERE id = ?
  `,
  [passwordHash, params.id]
);

console.log("USER ID:", params.id);
console.log("UPDATE RESULT:", result);

    return NextResponse.json({
      success: true,
      message: "Password reset successfully.",
    });

  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}