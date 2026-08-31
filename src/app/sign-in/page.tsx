"use client";

import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn.email({ email, password });
    setLoading(false);

    if (result.error) {
      setError("Incorrect email or password. If you think this is wrong, let Dave know.");
    } else {
      router.push("/submit-roster");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 text-3xl">🏈</div>
          <h1 className="text-xl font-semibold tracking-tight text-fg">
            Ballboys Offseason
          </h1>
          <p className="mt-2 text-[13px] text-fg-muted">
            Sign in with the email and password Dave gave you.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-center text-[13px] text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-line bg-surface p-6">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[13px] font-medium text-fg">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-line bg-elevated px-3 py-2 text-[14px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[13px] font-medium text-fg">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-line bg-elevated px-3 py-2 text-[14px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-[12px] text-fg-subtle">
          If you are not a part of the Ballboys League, then I bid you adieu 👋
        </p>
      </div>
    </div>
  );
}
