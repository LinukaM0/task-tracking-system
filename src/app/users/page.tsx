import { redirect } from "next/navigation";

import UserManager from "@/components/users/UserManager";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getTaskUser } from "@/lib/task-management";

export default async function UsersPage() {
  const actor = await getTaskUser();
  if (!actor) redirect("/login");
  if (actor.role !== "ADMIN") redirect("/dashboard");

  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
          Administration
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage accounts and roles. Your own account cannot be deleted.
        </p>
      </div>

      <UserManager
        users={userRows.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
