import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, toEmail } from "@/lib/supabase";

// POST /api/admin/users — create a new user (admin only)
export async function POST(req: NextRequest) {
  try {
    const { username, password, role = "user" } = (await req.json()) as {
      username: string; password: string; role?: string;
    };
    if (!username || !password) {
      return NextResponse.json({ error: "username and password required" }, { status: 400 });
    }
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email: toEmail(username),
      password,
      email_confirm: true,
      user_metadata: { username, role, must_change_password: true },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await admin.from("profiles").upsert(
      { id: data.user.id, username, role },
      { onConflict: "id" }
    );
    return NextResponse.json({ status: "created", username });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

// GET /api/admin/users — list all users
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("profiles").select("*").order("created_at");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ users: data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

// PATCH /api/admin/users — reset a user's password
export async function PATCH(req: NextRequest) {
  try {
    const { id, password } = (await req.json()) as { id: string; password: string };
    if (!id || !password) return NextResponse.json({ error: "id and password required" }, { status: 400 });
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(id, {
      password,
      user_metadata: { must_change_password: true },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ status: "updated" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

// DELETE /api/admin/users?id=uuid — remove a user
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ status: "deleted" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
