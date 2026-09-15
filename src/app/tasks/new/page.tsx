import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import TaskForm from "@/components/tasks/TaskForm";
import { db } from "@/db";
import { projects, users } from "@/db/schema";
import { canManageTasks, getTaskUser } from "@/lib/task-management";

export default async function NewTaskPage() {
  const user = await getTaskUser();
  if (!user) redirect("/login");
  if (!canManageTasks(user.role)) redirect("/tasks");
  const [projectRows, developerRows] = await Promise.all([db.select({ id: projects.id, name: projects.name }).from(projects), db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, "DEVELOPER"))]);
  return <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900"><div className="mx-auto max-w-2xl"><h1 className="mb-2 text-3xl font-bold">Create task</h1><p className="mb-6 text-sm text-slate-600">Add work to a project and assign it to a developer.</p>{projectRows.length === 0 ? <div className="rounded-2xl bg-white p-6 text-slate-600">Create a project before adding tasks.</div> : <TaskForm projects={projectRows} developers={developerRows} />}</div></main>;
}
