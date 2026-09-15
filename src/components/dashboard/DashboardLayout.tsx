"use client";

import type { ReactNode } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

type SidebarItem = {
  label: string;
  value: string;
  active?: boolean;
};

export function Sidebar({ items }: { items: SidebarItem[] }) {
  return (
    <aside className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:w-72">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
          T
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Workspace
          </p>
          <p className="text-lg font-bold text-slate-900">TaskFlow</p>
        </div>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const className = `flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
            item.active
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`;

          return item.value === "logout" ? (
            <button key={item.value} type="button" onClick={() => signOut({ callbackUrl: "/login" })} className={className}>
              <span>{item.label}</span>
              <span className="text-xs opacity-75">{item.value}</span>
            </button>
          ) : (
            <Link key={item.value} href={`/${item.value === "my-tasks" ? "tasks" : item.value}`} className={className}>
              <span>{item.label}</span>
              <span className="text-xs opacity-75">{item.value}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
        {label}
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {subtitle ? <span className="text-sm text-slate-500">{subtitle}</span> : null}
      </div>
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    TODO: "bg-slate-100 text-slate-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
        map[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    HIGH: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
        map[priority] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {priority}
    </span>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${color ?? "bg-gradient-to-r from-blue-500 to-emerald-500"}`}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}
