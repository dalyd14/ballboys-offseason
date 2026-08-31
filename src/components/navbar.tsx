import Link from "next/link";
import { getSession } from "@/lib/session";
import { SignOutButton } from "@/components/sign-out-button";
import { MobileNav } from "@/components/mobile-nav";

export async function Navbar() {
  const session = await getSession();
  const isLoggedIn = !!session;
  const isAdmin = session?.user?.role === "admin";

  const navLinks = [
    { href: "/submit-roster", label: "Submit Roster" },
    { href: "/my-team", label: "My Team" },
    { href: "/other-teams", label: "Other Teams" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const navLink = "text-[13px] text-fg-muted transition-colors hover:text-fg";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        {/* Left: brand + nav (desktop) */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
            <span className="text-lg">🏈</span>
            Ballboys
          </Link>
          {isLoggedIn && (
            <nav className="hidden items-center gap-6 sm:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={link.href === "/admin" ? `${navLink} font-medium text-fg` : navLink}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Right: user (desktop) */}
        <div className="hidden items-center gap-4 sm:flex">
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

        {/* Mobile hamburger */}
        {isLoggedIn && <MobileNav navLinks={navLinks} userEmail={session.user.email} />}
      </div>
    </header>
  );
}
