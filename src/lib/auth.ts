import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { Pool } from "@neondatabase/serverless";

/**
 * Better Auth instance for the Ballboys Offseason app.
 *
 * Uses email/password credentials (commish assigns passwords).
 * The `user` table is extended with league fields that map to the
 * old MongoDB "owner" document so auth + league state live in one row.
 */
export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  user: {
    // League-specific fields stored on the auth user row.
    // These replace the old MongoDB "owner" document.
    additionalFields: {
      role: {
        type: ["user", "admin"],
        required: false,
        defaultValue: "user",
        input: false, // users cannot self-assign admin
      },
      ownerName: {
        type: "string",
        required: false,
        input: false,
      },
      teamName: {
        type: "string",
        required: false,
        input: false,
      },
      // Salary cap years available this offseason (set by admin).
      availableYears: {
        type: "number",
        required: false,
        defaultValue: 0,
        input: false,
      },
      // Renegotiation tokens available this offseason (set by admin).
      // Default 1; can be 0 or >1 if traded.
      availableNegotiations: {
        type: "number",
        required: false,
        defaultValue: 1,
        input: false,
      },
      // Whether the owner has submitted their roster this offseason.
      rosterSubmitted: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      // Whether the owner is allowed to submit (offseason window open/closed).
      canSubmit: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  plugins: [
    nextCookies(),
    admin(),
  ],
});
