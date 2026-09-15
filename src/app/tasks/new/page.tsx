import Link from "next/link";
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
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tasks
        </Link>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
          Work tracking
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Create task</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add work to a project and assign it to a developer.
        </p>
      </div>

      {projectRows.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          <p className="font-semibold">No projects found</p>
          <p className="mt-1">
            Please{" "}
            <Link href="/projects/new" className="font-semibold underline hover:text-amber-900">
              create a project
            </Link>{" "}
            before adding tasks.
          </p>
        </div>
      ) : (
        <TaskForm projects={projectRows} developers={developerRows} />
      )}
    </div>
  );
}
