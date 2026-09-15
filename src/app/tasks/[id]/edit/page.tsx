import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import TaskForm from "@/components/tasks/TaskForm";
import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import { canEditTask, getTaskUser } from "@/lib/task-management";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getTaskUser();
  if (!user) redirect("/login");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!task) notFound();
  if (!canEditTask(user.role, user.id, task)) redirect(`/tasks/${id}`);
  const [projectRows, developerRows] = await Promise.all([db.select({ id: projects.id, name: projects.name }).from(projects), db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, "DEVELOPER"))]);
  return <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900"><div className="mx-auto max-w-2xl"><h1 className="mb-2 text-3xl font-bold">Edit task</h1><p className="mb-6 text-sm text-slate-600">Update task details and delivery status.</p><TaskForm task={{ ...task, dueDate: task.dueDate?.toISOString().slice(0, 10) }} projects={projectRows} developers={developerRows} /></div></main>;
}
