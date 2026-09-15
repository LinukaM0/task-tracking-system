import { redirect } from "next/navigation";

import UserManager from "@/components/users/UserManager";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getTaskUser } from "@/lib/task-management";

export default async function UsersPage() {
  const actor = await getTaskUser();
  if (!actor) redirect("/login");
  if (actor.role !== "ADMIN") redirect("/dashboard");
  const userRows = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt }).from(users);
  return <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900"><div className="mx-auto max-w-7xl"><header className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Administration</p><h1 className="mt-2 text-3xl font-bold">Users</h1><p className="mt-2 text-sm text-slate-600">Manage accounts and roles. Your own account cannot be deleted.</p></header><UserManager users={userRows.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() }))} /></div></main>;
}
