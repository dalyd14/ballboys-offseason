import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { OverviewIcon, OffseasonIcon, PlayersIcon, AuditIcon, UsersIcon } from "@/components/icons";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/sign-in");
  }

  const navLinks = [
    { href: "/admin", label: "Overview", Icon: OverviewIcon },
    { href: "/admin/offseason", label: "Offseason", Icon: OffseasonIcon },
    { href: "/admin/players", label: "Players", Icon: PlayersIcon },
    { href: "/admin/owners", label: "Owners", Icon: UsersIcon },
    { href: "/admin/audit", label: "Audit Log", Icon: AuditIcon },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3 sm:mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-fg">
          Commissioner
        </h1>
        <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
          Admin
        </span>
      </div>

      {/* Desktop: sidebar + content. Mobile: horizontal scrollable nav */}
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="shrink-0 lg:w-52">
          {/* Mobile: horizontal scroll */}
          <nav className="flex gap-1 overflow-x-auto lg:space-y-0.5 lg:overflow-visible lg:flex-col">
            {navLinks.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-fg-muted transition-colors hover:bg-hover hover:text-fg lg:gap-3"
              >
                <Icon className="h-4 w-4 text-fg-subtle" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
