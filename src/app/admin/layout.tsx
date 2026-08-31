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
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      <div className="mb-8 flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-fg">
          Commissioner
        </h1>
        <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
          Admin
        </span>
      </div>

      <div className="flex gap-8">
        <aside className="w-52 shrink-0">
          <nav className="space-y-0.5">
            {navLinks.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-fg-muted transition-colors hover:bg-hover hover:text-fg"
              >
                <Icon className="h-4 w-4 text-fg-subtle" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
