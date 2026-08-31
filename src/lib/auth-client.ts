import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client for use in Client Components.
 * Import from "better-auth/react" for React hooks (useSession, etc.).
 */
export const authClient = createAuthClient();

export const {
  signIn,
  signOut,
  useSession,
} = authClient;
