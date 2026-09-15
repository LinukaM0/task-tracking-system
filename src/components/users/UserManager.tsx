"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type User = { id: number; name: string; email: string; role: string; createdAt: string };

export default function UserManager({ users }: { users: User[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("DEVELOPER");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function startEdit(user: User) { setEditing(user); setName(user.name); setEmail(user.email); setRole(user.role); setPassword(""); setError(""); }
  function reset() { setEditing(null); setName(""); setEmail(""); setRole("DEVELOPER"); setPassword(""); setError(""); }
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(""); try { const response = await fetch(editing ? `/api/users/${editing.id}` : "/api/users", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, role, ...(password ? { password } : {}) }) }); const data = await response.json(); if (!response.ok) { setError(data.error ?? "Unable to save user"); return; } reset(); router.refresh(); } catch { setError("Unable to save user"); } finally { setLoading(false); } }
  async function remove(id: number) { if (!window.confirm("Delete this user?")) return; const response = await fetch(`/api/users/${id}`, { method: "DELETE" }); const data = await response.json(); if (!response.ok) setError(data.error ?? "Unable to delete user"); else router.refresh(); }

  return <div className="grid gap-6 lg:grid-cols-[320px_1fr]"><form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">{editing ? "Edit user" : "Create user"}</h2><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" required className="w-full rounded-lg border border-slate-300 px-3 py-2" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required className="w-full rounded-lg border border-slate-300 px-3 py-2" /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={editing ? "New password (optional)" : "Password"} required={!editing} minLength={6} className="w-full rounded-lg border border-slate-300 px-3 py-2" /><select value={role} onChange={(event) => setRole(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option>ADMIN</option><option>MANAGER</option><option>DEVELOPER</option></select>{error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}<div className="flex gap-2"><button disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white">{loading ? "Saving..." : editing ? "Save" : "Create"}</button>{editing ? <button type="button" onClick={reset} className="rounded-lg border border-slate-300 px-4 py-2">Cancel</button> : null}</div></form><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-4">Name</th><th className="px-5 py-4">Email</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Created</th><th className="px-5 py-4">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{users.map((user) => <tr key={user.id}><td className="px-5 py-4 font-medium">{user.name}</td><td className="px-5 py-4">{user.email}</td><td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{user.role}</span></td><td className="px-5 py-4">{new Date(user.createdAt).toLocaleDateString()}</td><td className="px-5 py-4"><div className="flex gap-3"><button onClick={() => startEdit(user)} className="text-blue-600 hover:underline">Edit</button><button onClick={() => remove(user.id)} className="text-rose-700 hover:underline">Delete</button></div></td></tr>)}</tbody></table></div></div></div>;
}
