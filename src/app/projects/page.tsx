import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import { canManageProjects, formatDate, getProjectUser } from "@/lib/project-management";
import { ProgressBar } from "@/components/dashboard/DashboardLayout";

const STATUS_STYLES: Record<string, { badge: string; accent: string }> = {
  PLANNED: { badge: "bg-sky-100 text-sky-700", accent: "border-l-sky-400" },
  IN_PROGRESS: { badge: "bg-indigo-100 text-indigo-700", accent: "border-l-indigo-400" },
  COMPLETED: { badge: "bg-emerald-100 text-emerald-700", accent: "border-l-emerald-400" },
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; sort?: string }>;
}) {
  const user = await getProjectUser();
  if (!user) redirect("/login");

  const filters = await searchParams;
  const search = filters.search?.trim().toLowerCase() ?? "";
  const status = filters.status ?? "ALL";
  const sort = filters.sort ?? "newest";

  const [projectRows, taskRows, userRows] = await Promise.all([
    db.select().from(projects),
    db.select().from(tasks),
    db.select({ id: users.id, name: users.name }).from(users),
  ]);
  const creatorNames = new Map(userRows.map((row) => [row.id, row.name]));

  const visibleProjects = projectRows
    .filter((project) => {
      const projectTasks = taskRows.filter((task) => task.projectId === project.id);
      const relevant =
        user.role !== "DEVELOPER" ||
        projectTasks.some(
          (task) => task.assignedTo !== null && Number(task.assignedTo) === user.id
        );
      const matchesSearch =
        !search ||
        `${project.name} ${project.description ?? ""}`.toLowerCase().includes(search);
      return relevant && matchesSearch && (status === "ALL" || project.status === status);
    })
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "oldest") return a.createdAt.getTime() - b.createdAt.getTime();
      if (sort === "endDate")
        return (a.endDate?.getTime() ?? Infinity) - (b.endDate?.getTime() ?? Infinity);
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Project management
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">
            Browse and manage the projects available to your role.
          </p>
        </div>
        {canManageProjects(user.role) ? (
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New project
          </Link>
        ) : null}
      </div>

      {/* Filter bar */}
      <form
        method="get"
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_160px_160px_auto]">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              name="search"
              defaultValue={filters.search ?? ""}
              placeholder="Search projects…"
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-400 transition-colors"
            />
          </div>
          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-400 transition-colors"
          >
            <option value="ALL">All statuses</option>
            <option value="PLANNED">Planned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-400 transition-colors"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
            <option value="endDate">End date</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 active:scale-[0.98] transition-all"
          >
            Apply
          </button>
        </div>
      </form>

      {/* Results */}
      {visibleProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-6 text-center">
          <svg className="h-12 w-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          <p className="text-base font-semibold text-slate-700">No projects found</p>
          <p className="mt-1 text-sm text-slate-400">Try adjusting your filters or create a new project.</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {visibleProjects.map((project) => {
            const projectTasks = taskRows.filter((task) => task.projectId === project.id);
            const completedCount = projectTasks.filter((t) => t.status === "COMPLETED").length;
            const percentage =
              projectTasks.length === 0
                ? 0
                : Math.round((completedCount / projectTasks.length) * 100);
            const style = STATUS_STYLES[project.status] ?? STATUS_STYLES.PLANNED;

            return (
              <article
                key={project.id}
                className={`group rounded-2xl border border-slate-200 border-l-4 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${style.accent}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-900 truncate">
                      <Link
                        href={`/projects/${project.id}`}
                        className="hover:text-indigo-600 transition-colors"
                      >
                        {project.name}
                      </Link>
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-500 line-clamp-2">
                      {project.description || "No description provided"}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}>
                    {project.status.replace("_", " ")}
                  </span>
                </div>

                {/* Meta */}
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Start</dt>
                    <dd className="mt-0.5 font-medium text-slate-700">{formatDate(project.startDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">End</dt>
                    <dd className="mt-0.5 font-medium text-slate-700">{formatDate(project.endDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Created by</dt>
                    <dd className="mt-0.5 font-medium text-slate-700 truncate">
                      {project.createdBy ? creatorNames.get(project.createdBy) ?? "Unknown" : "Unknown"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Tasks</dt>
                    <dd className="mt-0.5 font-medium text-slate-700">{projectTasks.length}</dd>
                  </div>
                </dl>

                {/* Progress */}
                <div className="mt-5">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">Completion</span>
                    <span className="font-semibold text-slate-700">{percentage}%</span>
                  </div>
                  <ProgressBar value={percentage} />
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-3 pt-4 border-t border-slate-100">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    View details →
                  </Link>
                  {canManageProjects(user.role) ? (
                    <Link
                      href={`/projects/${project.id}/edit`}
                      className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Edit
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
