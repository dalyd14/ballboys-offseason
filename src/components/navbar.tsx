import Link from "next/link";
import { getSession } from "@/lib/session";
import { SignOutButton } from "@/components/sign-out-button";

export async function Navbar() {
  const session = await getSession();
  const isLoggedIn = !!session;
  const isAdmin = session?.user?.role === "admin";

  const navLink = "text-[13px] text-fg-muted transition-colors hover:text-fg";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-[1200px] items-center justify-between px-6">
        {/* Left: brand + nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            <span className="text-lg">🏈</span>
            Ballboys
          </Link>
          {isLoggedIn && (
            <nav className="flex items-center gap-6">
              <Link href="/submit-roster" className={navLink}>
                Submit Roster
              </Link>
              <Link href="/my-team" className={navLink}>
                My Team
              </Link>
              <Link href="/other-teams" className={navLink}>
                Other Teams
              </Link>
              {isAdmin && (
                <Link href="/admin" className={`${navLink} font-medium text-fg`}>
                  Admin
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* Right: user */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-fg-subtle">{session.user.email}</span>
              <SignOutButton />
            </div>
          ) : (
            <Link href="/sign-in" className={navLink}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
