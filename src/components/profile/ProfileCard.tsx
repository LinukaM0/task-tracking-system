"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ProfileCardProps = {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
};

const ROLE_STYLES: Record<string, { badge: string; dot: string }> = {
  ADMIN: {
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
  MANAGER: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  DEVELOPER: {
    badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfileCard({ user }: ProfileCardProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [savedName, setSavedName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const roleMeta = ROLE_STYLES[user.role] ?? {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  };

  const isDirty = name.trim() !== savedName.trim();
  const initials = getInitials(savedName);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isDirty || saving) return;

    if (name.trim().length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to update profile.");
        return;
      }

      setSavedName(data.user.name);
      setName(data.user.name);
      setSuccess("Profile full name updated successfully.");
      router.refresh();
    } catch {
      setError("Unable to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setName(savedName);
    setError("");
    setSuccess("");
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Banner background */}
      <div className="h-28 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700" />

      {/* Profile Header & Info */}
      <div className="relative z-10 px-6 pb-6">
        {/* Avatar and Role Pill */}
        <div className="-mt-14 mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-end gap-4">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-indigo-100 text-3xl font-extrabold text-indigo-700 shadow-md select-none ring-1 ring-slate-900/5">
              {initials}
            </div>
            <div className="mb-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900 truncate">{savedName}</h2>
              <p className="text-sm text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <div className="mb-1">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${roleMeta.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${roleMeta.dot}`} />
              {user.role}
            </span>
          </div>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-rose-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 border-t border-slate-100 pt-6">
          {/* Full Name Field (Editable) */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="profile-full-name" className="text-sm font-semibold text-slate-800">
                Full name
              </label>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Can be updated
              </span>
            </div>
            <input
              id="profile-full-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
                setSuccess("");
              }}
              required
              minLength={2}
              maxLength={255}
              placeholder="Enter your full name"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-400"
            />
          </div>

          {/* Email Address Field (Read-only) */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="profile-email-addr" className="text-sm font-semibold text-slate-700">
                Email address
              </label>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Read-only
              </span>
            </div>
            <div className="relative">
              <input
                id="profile-email-addr"
                type="email"
                value={user.email}
                disabled
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 pr-10 text-sm font-medium text-slate-500 shadow-inner select-none"
              />
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Email address is managed by administrators and cannot be updated.
            </p>
          </div>

          {/* Role Field (Read-only) */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="profile-user-role" className="text-sm font-semibold text-slate-700">
                Role
              </label>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Read-only
              </span>
            </div>
            <div className="relative">
              <input
                id="profile-user-role"
                type="text"
                value={user.role}
                disabled
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 pr-10 text-sm font-bold tracking-wider text-slate-600 shadow-inner select-none uppercase"
              />
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              User role is assigned by administrators and cannot be changed.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!isDirty || saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            >
              {saving ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save changes</span>
              )}
            </button>

            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
