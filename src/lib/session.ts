import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { Owner } from "@/lib/types";

/**
 * Get the current session from a Server Component or Server Action.
 * Returns null if not authenticated.
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Get the current authenticated owner, or throw if not logged in.
 * Use in protected pages/actions.
 */
export async function requireOwner(): Promise<Owner> {
  const session = await getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }
  return session.user as unknown as Owner;
}

/**
 * Get the current authenticated admin, or throw if not an admin.
 * Use in admin-only pages/actions.
 */
export async function requireAdmin(): Promise<Owner> {
  const owner = await requireOwner();
  if (owner.role !== "admin") {
    throw new Error("Admin access required");
  }
  return owner;
}

/**
 * Check if the current user is an admin (non-throwing).
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.role === "admin";
}
