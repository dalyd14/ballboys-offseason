import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <h1 className="text-2xl font-bold">Commissioner Dashboard</h1>
        <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
          Admin
        </span>
      </div>
      <div className="flex flex-row gap-6">
        <aside className="w-48 shrink-0 space-y-1">
          <AdminSidebar />
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

function AdminSidebar() {
  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/season", label: "Seasons" },
    { href: "/admin/import", label: "ESPN Import" },
    { href: "/admin/review", label: "Review Exceptions" },
    { href: "/admin/owners", label: "Owners & Budgets" },
    { href: "/admin/players", label: "Players" },
    { href: "/admin/audit", label: "Audit Log" },
  ];

  return (
    <nav className="space-y-1">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
