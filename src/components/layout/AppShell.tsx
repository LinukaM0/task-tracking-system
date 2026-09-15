"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";

import { Sidebar } from "@/components/dashboard/DashboardLayout";

type SidebarItem = {
  label: string;
  value: string;
};

export default function AppShell({
  children,
  items,
  authenticated,
  userName,
  userRole,
}: {
  children: ReactNode;
  items: SidebarItem[];
  authenticated: boolean;
  userName?: string;
  userRole?: string;
}) {
  const pathname = usePathname();
  const isPublicPage = pathname === "/login" || pathname === "/register";
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  if (!authenticated || isPublicPage) return <>{children}</>;

  const enrichedItems = items.map((item) => ({
    ...item,
    active: isActive(item.value, pathname),
  }));

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* ── Desktop sidebar ──────────────────────────── */}
      <div className="hidden lg:flex lg:w-[260px] lg:shrink-0 lg:flex-col lg:fixed lg:inset-y-0">
        <Sidebar items={enrichedItems} userName={userName} userRole={userRole} />
      </div>

      {/* ── Mobile overlay ──────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ─────────────────────────── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[260px] transform transition-transform duration-300 ease-in-out lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar items={enrichedItems} userName={userName} userRole={userRole} />
      </div>

      {/* ── Main content area ─────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[260px]">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm select-none">
              T
            </div>
            <span className="text-base font-bold text-slate-900">TaskFlow</span>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Open navigation menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

function isActive(value: string, pathname: string) {
  const href = value === "my-tasks" ? "/tasks" : `/${value}`;
  return pathname === href || pathname.startsWith(`${href}/`);
}
