import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import TaskDeleteButton from "@/components/tasks/TaskDeleteButton";
import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import { canDeleteTasks, canEditTask, formatTaskDate, getTaskUser } from "@/lib/task-management";

export default async function TaskDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getTaskUser();
  if (!user) redirect("/login");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!task || (user.role === "DEVELOPER" && task.assignedTo !== user.id)) notFound();
  const [project] = await db.select({ id: projects.id, name: projects.name }).from(projects).where(eq(projects.id, task.projectId)).limit(1);
  const [assignee] = task.assignedTo ? await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, task.assignedTo)).limit(1) : [];
  const canEdit = canEditTask(user.role, user.id, task);
  return <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900"><div className="mx-auto max-w-4xl"><Link href="/tasks" className="text-sm font-medium text-blue-600 hover:underline">Back to tasks</Link><header className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><h1 className="text-3xl font-bold">{task.title}</h1><p className="mt-3 text-slate-600">{task.description || "No description provided"}</p></div><div className="flex gap-3">{canEdit ? <Link href={`/tasks/${task.id}/edit`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium">Edit task</Link> : null}{canDeleteTasks(user.role) ? <TaskDeleteButton taskId={task.id} /> : null}</div></div></header><section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[["Project", project?.name ?? "Unknown"],["Assigned developer", assignee ? `${assignee.name} (${assignee.email})` : "Unassigned"],["Status", task.status.replace("_", " ")],["Priority", task.priority],["Due date", formatTaskDate(task.dueDate)],["Created date", formatTaskDate(task.createdAt)],["Last updated", formatTaskDate(task.updatedAt)]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 font-semibold">{value}</p></div>)}</section></div></main>;
}
