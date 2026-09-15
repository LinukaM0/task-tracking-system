"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Sidebar } from "@/components/dashboard/DashboardLayout";

type SidebarItem = {
  label: string;
  value: string;
};

export default function AppShell({
  children,
  items,
  authenticated,
}: {
  children: ReactNode;
  items: SidebarItem[];
  authenticated: boolean;
}) {
  const pathname = usePathname();
  const isPublicPage = pathname === "/login" || pathname === "/register";

  if (!authenticated || isPublicPage) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <div className="p-4 lg:sticky lg:top-0 lg:h-screen lg:p-6">
        <Sidebar items={items.map((item) => ({ ...item, active: isActive(item.value, pathname) }))} />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function isActive(value: string, pathname: string) {
  const href = value === "my-tasks" ? "/tasks" : `/${value}`;
  return pathname === href || pathname.startsWith(`${href}/`);
}
