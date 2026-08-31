"use client";

import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="text-[13px] text-fg-muted transition-colors hover:text-fg disabled:opacity-50"
    >
      {loading ? "..." : "Sign Out"}
    </button>
  );
}
