"use client";

import type { ReactNode } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

/* ── Icon helpers ────────────────────────────────────────────────── */

type IconProps = { className?: string };

const icons: Record<string, (p: IconProps) => ReactNode> = {
  dashboard: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  projects: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" />
    </svg>
  ),
  tasks: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  "my-tasks": ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  kanban: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="5" height="18" rx="1" /><rect x="10" y="3" width="5" height="11" rx="1" /><rect x="17" y="3" width="4" height="15" rx="1" />
    </svg>
  ),
  users: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  profile: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  logout: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

function NavIcon({ name }: { name: string }) {
  const Icon = icons[name];
  return Icon ? <Icon className="h-5 w-5 shrink-0" /> : null;
}

/* ── Sidebar ──────────────────────────────────────────────────────── */

type SidebarItem = {
  label: string;
  value: string;
  active?: boolean;
};

export function Sidebar({
  items,
  userName,
  userRole,
}: {
  items: SidebarItem[];
  userName?: string;
  userRole?: string;
}) {
  const navItems = items.filter((item) => item.value !== "logout");

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const roleColor: Record<string, string> = {
    ADMIN: "bg-rose-100 text-rose-700",
    MANAGER: "bg-amber-100 text-amber-700",
    DEVELOPER: "bg-indigo-100 text-indigo-700",
  };

  return (
    <aside className="flex h-full w-full flex-col bg-white border-r border-slate-200">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-base shadow-sm select-none">
          T
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 leading-none">Workspace</p>
          <p className="mt-0.5 text-[17px] font-bold text-slate-900 leading-tight">TaskFlow</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Navigation
        </p>
        {navItems.map((item) => {
          const href = item.value === "my-tasks" ? "/tasks" : `/${item.value}`;
          return (
            <Link
              key={item.value}
              href={href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                item.active
                  ? "bg-indigo-50 text-indigo-700 shadow-[inset_0_0_0_1px_#c7d2fe]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className={`transition-colors ${item.active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`}>
                <NavIcon name={item.value} />
              </span>
              <span className="truncate">{item.label}</span>
              {item.active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile + logout */}
      <div className="border-t border-slate-100 px-3 py-3 space-y-1">
        {/* Profile link */}
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 transition-colors group"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold select-none">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{userName ?? "User"}</p>
            {userRole && (
              <span className={`inline-block mt-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${roleColor[userRole] ?? "bg-slate-100 text-slate-600"}`}>
                {userRole}
              </span>
            )}
          </div>
        </Link>

        {/* Logout */}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-700 transition-all duration-150 group"
        >
          <span className="text-slate-400 group-hover:text-rose-600 transition-colors">
            <NavIcon name="logout" />
          </span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

/* ── StatCard ──────────────────────────────────────────────────────── */

export function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string | number;
  tone: string;
  icon?: ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
          {label}
        </div>
        {icon && (
          <div className={`rounded-xl p-2 ${tone} opacity-80`}>
            {icon}
          </div>
        )}
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

/* ── SectionCard ──────────────────────────────────────────────────── */

export function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-base font-semibold text-slate-900 truncate">{title}</h2>
          {subtitle && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {subtitle}
            </span>
          )}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ── StatusBadge ──────────────────────────────────────────────────── */

const STATUS_STYLES: Record<string, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  PLANNED: "bg-sky-100 text-sky-700",
};

const STATUS_DOTS: Record<string, string> = {
  TODO: "bg-slate-400",
  IN_PROGRESS: "bg-indigo-500",
  COMPLETED: "bg-emerald-500",
  PLANNED: "bg-sky-500",
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  PLANNED: "Planned",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[status] ?? "bg-slate-400"}`} />
      {STATUS_LABELS[status] ?? status.replace(/_/g, " ")}
    </span>
  );
}

/* ── PriorityBadge ────────────────────────────────────────────────── */

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-sky-100 text-sky-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-rose-100 text-rose-700",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        PRIORITY_STYLES[priority] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {priority}
    </span>
  );
}

/* ── ProgressBar ──────────────────────────────────────────────────── */

export function ProgressBar({
  value,
  color,
}: {
  value: number;
  color?: string;
}) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color ?? "bg-gradient-to-r from-indigo-500 to-violet-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ── EmptyState ──────────────────────────────────────────────────── */

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 px-6 text-center">
      <svg className="h-10 w-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
