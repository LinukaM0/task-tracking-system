"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

const roleGroups = [
  {
    role: "ADMIN",
    label: "Administrators",
    tone: "bg-rose-100 text-rose-700",
    avatarBg: "bg-rose-100 text-rose-700",
  },
  {
    role: "MANAGER",
    label: "Project Managers",
    tone: "bg-amber-100 text-amber-700",
    avatarBg: "bg-amber-100 text-amber-700",
  },
  {
    role: "DEVELOPER",
    label: "Developers",
    tone: "bg-indigo-100 text-indigo-700",
    avatarBg: "bg-indigo-100 text-indigo-700",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function UserManager({ users }: { users: User[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("DEVELOPER");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function startEdit(user: User) {
    setEditing(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword("");
    setError("");
    // Scroll form into view on mobile
    document.getElementById("user-form")?.scrollIntoView({ behavior: "smooth" });
  }

  function reset() {
    setEditing(null);
    setName("");
    setEmail("");
    setRole("DEVELOPER");
    setPassword("");
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        editing ? `/api/users/${editing.id}` : "/api/users",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            role,
            ...(password ? { password } : {}),
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to save user");
        return;
      }

      reset();
      router.refresh();
    } catch {
      setError("Unable to save user");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this user?")) return;
    const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "Unable to delete user");
    else router.refresh();
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-400";

  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* ── Form ── */}
      <form
        id="user-form"
        onSubmit={submit}
        className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            {editing ? "Edit user" : "Create user"}
          </h2>
          {editing && (
            <button
              type="button"
              onClick={reset}
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
            >
              Cancel edit
            </button>
          )}
        </div>

        <div>
          <label className={labelClass}>Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            {editing ? "New password" : "Password"}{" "}
            {editing && (
              <span className="text-xs font-normal text-slate-400">(leave blank to keep)</span>
            )}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={editing ? "Leave blank to keep" : "Min. 6 characters"}
            required={!editing}
            minLength={6}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputClass}
          >
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="DEVELOPER">Developer</option>
          </select>
        </div>

        {error ? (
          <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
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
            {error}
          </div>
        ) : null}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </>
            ) : editing ? (
              "Save changes"
            ) : (
              "Create user"
            )}
          </button>
          {editing ? (
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {/* ── User tables by role ── */}
      <div className="space-y-5">
        {roleGroups.map((group) => {
          const groupUsers = users.filter((u) => u.role === group.role);

          return (
            <section
              key={group.role}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              {/* Section header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">{group.label}</h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {groupUsers.length} {groupUsers.length === 1 ? "user" : "users"}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${group.tone}`}>
                  {group.role}
                </span>
              </div>

              {groupUsers.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-slate-400">No {group.label.toLowerCase()} found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">User</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Email</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Joined</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groupUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold select-none ${group.avatarBg}`}
                              >
                                {getInitials(user.name)}
                              </div>
                              <span className="font-medium text-slate-900">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-600">{user.email}</td>
                          <td className="px-5 py-4 text-slate-500">
                            {new Date(user.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => startEdit(user)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() => remove(user.id)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <polyline points="3 6 5 6 21 6" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m5 0V4a1 1 0 011-1h2a1 1 0 011 1v2" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
