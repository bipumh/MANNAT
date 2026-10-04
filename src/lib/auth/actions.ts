"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";

export type AuthFormState = {
  error?: string;
};

function mapError(error: unknown): string {
  if (!error) return "Something went wrong. Please try again.";

  const e = error as { message?: string; code?: string };
  const combined = `${e.message ?? ""} ${e.code ?? ""}`.toLowerCase();

  if (/invalid[_ ]?(email|password|credentials)/i.test(combined)) {
    return "Invalid email or password.";
  }
  if (/already.*(exist|registered)|user.*exist/i.test(combined)) {
    return "An account with this email already exists.";
  }
  if (e.message) return e.message;
  return "Something went wrong. Please try again.";
}

/**
 * Only allow same-origin, internal paths — reject protocol-relative and
 * backslash-prefixed values that browsers would normalize into an external
 * redirect (open redirect protection).
 */
function safeNextPath(next: string): string {
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : "/dashboard";
}

/**
 * Creates the user's profile, personal workspace and owner membership in one
 * atomic statement, and marks that workspace as their active workspace. Runs
 * after a successful sign-up (the user id comes from the sign-up response,
 * never from client input).
 */
async function provisionAccount(userId: string, fullName: string): Promise<void> {
  const sql = getDb();
  const name = fullName.trim();
  const workspaceName = name ? `${name}'s workspace` : "My workspace";

  await sql`
    with p as (
      insert into profiles (id, full_name)
      values (${userId}, ${name})
      on conflict (id) do update set full_name = excluded.full_name
      returning id
    ), w as (
      insert into workspaces (name)
      values (${workspaceName})
      returning id
    ), m as (
      insert into workspace_members (workspace_id, user_id, role)
      select w.id, p.id, 'owner' from p, w
      returning workspace_id, user_id
    )
    update profiles
    set active_workspace_id = m.workspace_id
    from m
    where profiles.id = m.user_id
  `;
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const next = (formData.get("next") as string | null) ?? "";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await auth.signIn.email({ email, password });
  if (error) return { error: mapError(error) };

  redirect(safeNextPath(next));
}

export async function signupAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const fullName = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const next = (formData.get("next") as string | null) ?? "";

  if (!fullName || !email || !password) {
    return { error: "Name, email and password are required." };
  }

  const { data, error } = await auth.signUp.email({
    email,
    password,
    name: fullName,
  });
  if (error) return { error: mapError(error) };

  const userId = data?.user?.id;
  if (userId) {
    try {
      await provisionAccount(userId, fullName);
    } catch (err) {
      // The account exists even if provisioning fails; the session helper has
      // graceful fallbacks, so don't block sign-in on a provisioning error.
      console.error("[mannat] account provisioning failed:", err);
    }
  }

  redirect(safeNextPath(next));
}

export async function logoutAction(): Promise<void> {
  await auth.signOut();
  redirect("/login");
}
