import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import { canManageTasks, formatTaskDate, getTaskUser } from "@/lib/task-management";
import { StatusBadge, PriorityBadge } from "@/components/dashboard/DashboardLayout";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getTaskUser();
  if (!user) redirect("/login");

  const filters = await searchParams;
  const search = filters.search?.toLowerCase() ?? "";
  const status = filters.status ?? "ALL";
  const priority = filters.priority ?? "ALL";
  const projectId = Number(filters.projectId);
  const assignedTo = Number(filters.assignedTo);
  const sort = filters.sort ?? "newest";

  const [taskRows, projectRows, userRows] = await Promise.all([
    db.select().from(tasks),
    db.select().from(projects),
    db.select({ id: users.id, name: users.name, role: users.role }).from(users),
  ]);

  const projectNames = new Map(projectRows.map((p) => [p.id, p.name]));
  const userNames = new Map(userRows.map((u) => [u.id, u.name]));

  const visible = taskRows
    .filter((task) =>
      (user.role !== "DEVELOPER" || task.assignedTo === user.id) &&
      (!search || task.title.toLowerCase().includes(search)) &&
      (status === "ALL" || task.status === status) &&
      (priority === "ALL" || task.priority === priority) &&
      (!Number.isInteger(projectId) || projectId < 1 || task.projectId === projectId) &&
      (!Number.isInteger(assignedTo) || assignedTo < 1 || task.assignedTo === assignedTo)
    )
    .sort((a, b) =>
      sort === "dueDate"
        ? (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity)
        : sort === "priority"
          ? ["URGENT", "HIGH", "MEDIUM", "LOW"].indexOf(a.priority) -
            ["URGENT", "HIGH", "MEDIUM", "LOW"].indexOf(b.priority)
          : b.createdAt.getTime() - a.createdAt.getTime()
    );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Work tracking
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">
            Search, filter, and manage the work visible to your role.
          </p>
        </div>
        {canManageTasks(user.role) ? (
          <Link
            href="/tasks/new"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New task
          </Link>
        ) : null}
      </div>

      {/* Filter form */}
      <form method="get" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
          <div className="relative sm:col-span-2 xl:col-span-2">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              name="search"
              defaultValue={filters.search ?? ""}
              placeholder="Search task title…"
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-400 transition-colors"
            />
          </div>

          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-400 transition-colors"
          >
            <option value="ALL">All statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            name="priority"
            defaultValue={priority}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-400 transition-colors"
          >
            <option value="ALL">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <select
            name="projectId"
            defaultValue={filters.projectId ?? ""}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-400 transition-colors"
          >
            <option value="">All projects</option>
            {projectRows.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            name="sort"
            defaultValue={sort}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-400 transition-colors"
          >
            <option value="newest">Newest</option>
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
          </select>

          {user.role !== "DEVELOPER" && (
            <select
              name="assignedTo"
              defaultValue={filters.assignedTo ?? ""}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-400 transition-colors"
            >
              <option value="">All assignees</option>
              {userRows
                .filter((u) => u.role === "DEVELOPER")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          )}

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 active:scale-[0.98] transition-all"
          >
            Apply
          </button>
        </div>
      </form>

      {/* Results */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-6 text-center">
          <svg className="h-12 w-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <p className="text-base font-semibold text-slate-700">No tasks found</p>
          <p className="mt-1 text-sm text-slate-400">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Task</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Project</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Assignee</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Due</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-4 max-w-[260px]">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                      >
                        {task.title}
                      </Link>
                      {task.description && (
                        <p className="mt-0.5 truncate text-xs text-slate-400 max-w-[240px]">
                          {task.description}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-700 whitespace-nowrap">
                      {projectNames.get(task.projectId) ?? "Unknown"}
                    </td>
                    <td className="px-5 py-4 text-slate-700 whitespace-nowrap">
                      {task.assignedTo ? userNames.get(task.assignedTo) ?? "Unknown" : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                      {formatTaskDate(task.dueDate)}
                    </td>
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                      {formatTaskDate(task.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            Showing {visible.length} {visible.length === 1 ? "task" : "tasks"}
          </div>
        </div>
      )}
    </div>
  );
}
