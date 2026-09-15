import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import TaskDeleteButton from "@/components/tasks/TaskDeleteButton";
import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import {
  canDeleteTasks,
  canEditTask,
  formatTaskDate,
  getTaskUser,
} from "@/lib/task-management";
import { StatusBadge, PriorityBadge } from "@/components/dashboard/DashboardLayout";

export default async function TaskDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getTaskUser();
  if (!user) redirect("/login");

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();

  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!task || (user.role === "DEVELOPER" && task.assignedTo !== user.id)) notFound();

  const [project] = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(eq(projects.id, task.projectId))
    .limit(1);

  const [assignee] = task.assignedTo
    ? await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, task.assignedTo))
        .limit(1)
    : [];

  const canEdit = canEditTask(user.role, user.id, task);

  const details: [string, string][] = [
    ["Project", project?.name ?? "Unknown"],
    ["Assigned developer", assignee ? `${assignee.name} (${assignee.email})` : "Unassigned"],
    ["Due date", formatTaskDate(task.dueDate)],
    ["Created", formatTaskDate(task.createdAt)],
    ["Last updated", formatTaskDate(task.updatedAt)],
  ];

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tasks
        </Link>
      </div>

      {/* Task header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-start gap-3">
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">{task.title}</h1>
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
            {task.description && (
              <p className="mt-3 text-slate-600 leading-relaxed">{task.description}</p>
            )}
            {!task.description && (
              <p className="mt-3 text-sm text-slate-400 italic">No description provided</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {canEdit ? (
              <Link
                href={`/tasks/${task.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit task
              </Link>
            ) : null}
            {canDeleteTasks(user.role) ? (
              <TaskDeleteButton taskId={task.id} />
            ) : null}
          </div>
        </div>
      </div>

      {/* Detail cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {details.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-2 font-semibold text-slate-900 text-sm leading-relaxed">{value}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
