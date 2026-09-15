import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import TaskForm from "@/components/tasks/TaskForm";
import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import { canEditTask, getTaskUser } from "@/lib/task-management";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getTaskUser();
  if (!user) redirect("/login");

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();

  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!task) notFound();
  if (!canEditTask(user.role, user.id, task)) redirect(`/tasks/${id}`);

  const [projectRows, developerRows] = await Promise.all([
    db.select({ id: projects.id, name: projects.name }).from(projects),
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.role, "DEVELOPER")),
  ]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/tasks/${task.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to task
        </Link>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
          Work tracking
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Edit task</h1>
        <p className="mt-1 text-sm text-slate-500">
          Update task details and delivery status.
        </p>
      </div>
      <TaskForm
        task={{ ...task, dueDate: task.dueDate?.toISOString().slice(0, 10) }}
        projects={projectRows}
        developers={developerRows}
      />
    </div>
  );
}
