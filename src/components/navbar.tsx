import Link from "next/link";
import { getSession } from "@/lib/session";
import { SignOutButton } from "@/components/sign-out-button";

export async function Navbar() {
  const session = await getSession();
  const isLoggedIn = !!session;
  const isAdmin = session?.user?.role === "admin";

  return (
    <nav className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-lg">
              🏈 Ballboys Offseason
            </Link>
            {isLoggedIn && (
              <div className="flex items-center gap-4 text-sm">
                <Link href="/submit-roster" className="hover:text-gray-300">
                  Submit Roster
                </Link>
                <Link href="/my-team" className="hover:text-gray-300">
                  My Team
                </Link>
                <Link href="/other-teams" className="hover:text-gray-300">
                  Other Teams
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="hover:text-gray-300 font-semibold">
                    Admin
                  </Link>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="text-gray-400">{session.user.email}</span>
                <SignOutButton />
              </div>
            ) : (
              <Link href="/sign-in" className="hover:text-gray-300">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
