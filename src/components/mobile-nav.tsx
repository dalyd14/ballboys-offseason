"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

interface MobileNavProps {
  navLinks: { href: string; label: string }[];
  userEmail: string;
}

export function MobileNav({ navLinks, userEmail }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex items-center sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-hover hover:text-fg"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-12 z-40 bg-bg/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Menu panel */}
          <div className="fixed left-0 right-0 top-12 z-50 border-b border-line bg-surface px-4 py-4">
            <nav className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors ${
                    pathname === link.href
                      ? "bg-accent/10 text-accent"
                      : "text-fg-muted hover:bg-hover hover:text-fg"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <div className="px-3 text-[12px] text-fg-subtle">{userEmail}</div>
              <SignOutButton />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
