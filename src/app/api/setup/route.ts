import { NextResponse } from "next/server";
import { createAdminClient, toEmail } from "@/lib/supabase";

// Call this once after deployment: GET /api/setup
// Creates the admin account. Safe to call multiple times (idempotent).
export async function GET() {
  try {
    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email: toEmail("admin"),
      password: "a1234567!",
      email_confirm: true,
      user_metadata: { username: "admin", role: "admin" },
    });

    if (error) {
      // User already exists — that's fine
      if (error.message.includes("already")) {
        return NextResponse.json({ status: "already_exists", message: "Admin account already set up." });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Upsert profile in case trigger didn't fire
    await admin.from("profiles").upsert({
      id: data.user.id,
      username: "admin",
      role: "admin",
    }, { onConflict: "id" });

    return NextResponse.json({ status: "created", message: "Admin account created successfully." });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Setup failed" },
      { status: 500 }
    );
  }
}
