"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ProfileFormProps = {
  name: string;
  email: string;
  role: string;
};

export default function ProfileForm({ name: initialName, email: initialEmail, role }: ProfileFormProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to update profile");
        return;
      }

      setName(data.user.name);
      setMessage("Profile updated successfully.");
      setEditing(false);
      router.refresh();
    } catch {
      setError("Unable to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5 border-t border-slate-100 pt-6">
      <div>
        <label htmlFor="profile-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
          Full name
        </label>
        <input
          id="profile-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={!editing || saving}
          required
          minLength={2}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
        />
      </div>

      <div>
        <label htmlFor="profile-email" className="mb-1.5 block text-sm font-semibold text-slate-700">
          Email address
        </label>
        <input
          id="profile-email"
          type="email"
          value={initialEmail}
          readOnly
          className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 outline-none"
        />
        <p className="mt-1.5 text-xs text-slate-500">Email address can only be changed by an administrator.</p>
      </div>

      <div>
        <label htmlFor="profile-role" className="mb-1.5 block text-sm font-semibold text-slate-700">
          Role
        </label>
        <input
          id="profile-role"
          value={role}
          readOnly
          className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-500"
        />
        <p className="mt-1.5 text-xs text-slate-500">Your role can only be changed by an administrator.</p>
      </div>

      {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

      {editing ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setName(initialName);
              setError("");
              setMessage("");
              setEditing(false);
            }}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Edit profile
        </button>
      )}
    </form>
  );
}
