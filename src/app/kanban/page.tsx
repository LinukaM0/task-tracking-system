import Link from "next/link";
import { redirect } from "next/navigation";

import TaskStatusButton from "@/components/tasks/TaskStatusButton";
import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import { canManageTasks, formatTaskDate, getTaskUser } from "@/lib/task-management";
import { PriorityBadge } from "@/components/dashboard/DashboardLayout";

const columns = ["TODO", "IN_PROGRESS", "COMPLETED"] as const;

const COLUMN_META: Record<
  string,
  { label: string; headerBg: string; dot: string; countBg: string }
> = {
  TODO: {
    label: "To Do",
    headerBg: "bg-slate-50 border-slate-200",
    dot: "bg-slate-400",
    countBg: "bg-slate-200 text-slate-600",
  },
  IN_PROGRESS: {
    label: "In Progress",
    headerBg: "bg-indigo-50 border-indigo-200",
    dot: "bg-indigo-500",
    countBg: "bg-indigo-100 text-indigo-700",
  },
  COMPLETED: {
    label: "Completed",
    headerBg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
    countBg: "bg-emerald-100 text-emerald-700",
  },
};

export default async function KanbanPage() {
  const user = await getTaskUser();
  if (!user) redirect("/login");

  const [taskRows, projectRows, userRows] = await Promise.all([
    db.select().from(tasks),
    db.select({ id: projects.id, name: projects.name }).from(projects),
    db.select({ id: users.id, name: users.name }).from(users),
  ]);

  const projectNames = new Map(projectRows.map((p) => [p.id, p.name]));
  const userNames = new Map(userRows.map((u) => [u.id, u.name]));
  const visible = taskRows.filter(
    (task) => user.role !== "DEVELOPER" || task.assignedTo === user.id
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
          Workflow
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Kanban Board
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Move tasks between workflow states using the status control on each card.
        </p>
      </div>

      {/* Board */}
      <div className="grid gap-5 lg:grid-cols-3">
        {columns.map((column) => {
          const meta = COLUMN_META[column];
          const columnTasks = visible.filter((task) => task.status === column);

          return (
            <section key={column} className="flex flex-col min-h-[500px]">
              {/* Column header */}
              <div
                className={`flex items-center justify-between rounded-t-2xl border px-4 py-3 ${meta.headerBg}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                  <h2 className="text-sm font-semibold text-slate-800">{meta.label}</h2>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.countBg}`}
                >
                  {columnTasks.length}
                </span>
              </div>

              {/* Column body */}
              <div className="flex-1 rounded-b-2xl border border-t-0 border-slate-200 bg-slate-50 p-3 space-y-3">
                {columnTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center mt-2">
                    <svg
                      className="h-8 w-8 text-slate-300 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p className="text-xs text-slate-400">No tasks here</p>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <article
                      key={task.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
                    >
                      {/* Card top: title + priority */}
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors leading-snug"
                        >
                          {task.title}
                        </Link>
                        <PriorityBadge priority={task.priority} />
                      </div>

                      {/* Project */}
                      <p className="mt-2 text-xs text-slate-500 truncate">
                        {projectNames.get(task.projectId) ?? "Unknown project"}
                      </p>

                      {/* Assignee + due */}
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-400">
                        <span className="truncate">
                          {task.assignedTo
                            ? userNames.get(task.assignedTo) ?? "Unknown"
                            : "Unassigned"}
                        </span>
                        <span className="shrink-0">
                          Due {formatTaskDate(task.dueDate)}
                        </span>
                      </div>

                      {/* Status control */}
                      {canManageTasks(user.role) ||
                      task.assignedTo === user.id ? (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <TaskStatusButton
                            taskId={task.id}
                            status={task.status}
                          />
                        </div>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
