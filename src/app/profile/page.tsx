import { redirect } from "next/navigation";

import { getTaskUser } from "@/lib/task-management";

export default async function ProfilePage() {
  const user = await getTaskUser();
  if (!user) redirect("/login");
  return <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900"><div className="mx-auto max-w-2xl"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Account</p><h1 className="mt-2 text-3xl font-bold">Profile</h1><dl className="mt-6 space-y-4 text-sm"><div><dt className="text-slate-500">Name</dt><dd className="mt-1 font-semibold">{user.name}</dd></div><div><dt className="text-slate-500">Email</dt><dd className="mt-1 font-semibold">{user.email}</dd></div><div><dt className="text-slate-500">Role</dt><dd className="mt-1 font-semibold">{user.role}</dd></div></dl></div></div></main>;
}
