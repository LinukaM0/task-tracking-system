import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import DeleteProjectButton from "@/components/projects/DeleteProjectButton";
import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import { canDeleteProjects, canManageProjects, formatDate, getProjectUser } from "@/lib/project-management";
import { ProgressBar, StatusBadge, PriorityBadge } from "@/components/dashboard/DashboardLayout";

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getProjectUser();
  if (!user) redirect("/login");

  const projectId = Number((await params).id);
  if (!Number.isInteger(projectId) || projectId < 1) notFound();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!project) notFound();

  const allProjectTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  if (
    user.role === "DEVELOPER" &&
    !allProjectTasks.some(
      (task) => task.assignedTo !== null && Number(task.assignedTo) === user.id
    )
  )
    notFound();

  const projectTasks =
    user.role === "DEVELOPER"
      ? allProjectTasks.filter((task) => task.assignedTo === user.id)
      : allProjectTasks;

  const creator = project.createdBy
    ? (
        await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, project.createdBy))
          .limit(1)
      )[0]
    : null;

  const completed = projectTasks.filter((t) => t.status === "COMPLETED").length;
  const percentage =
    projectTasks.length === 0
      ? 0
      : Math.round((completed / projectTasks.length) * 100);

  const STATUS_BADGE: Record<string, string> = {
    PLANNED: "bg-sky-100 text-sky-700",
    IN_PROGRESS: "bg-indigo-100 text-indigo-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </Link>
      </div>

      {/* Project header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{project.name}</h1>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[project.status] ?? "bg-slate-100 text-slate-700"}`}>
                {project.status.replace("_", " ")}
              </span>
            </div>
            <p className="mt-3 text-slate-600 max-w-3xl leading-relaxed">
              {project.description || "No description provided"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {canManageProjects(user.role) ? (
              <Link
                href={`/projects/${project.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit project
              </Link>
            ) : null}
            {canDeleteProjects(user.role) ? (
              <DeleteProjectButton projectId={project.id} />
            ) : null}
          </div>
        </div>
      </div>

      {/* Stat mini-cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {(
          [
            ["Total Tasks", projectTasks.length, "text-slate-900"],
            ["To Do", projectTasks.filter((t) => t.status === "TODO").length, "text-slate-700"],
            ["In Progress", projectTasks.filter((t) => t.status === "IN_PROGRESS").length, "text-indigo-700"],
            ["Completed", completed, "text-emerald-700"],
            ["Completion", `${percentage}%`, "text-violet-700"],
          ] as [string, number | string, string][]
        ).map(([label, value, color]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </section>

      {/* Info + Tasks */}
      <section className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
        {/* Project info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Project information</h2>
          <dl className="mt-5 space-y-4">
            {[
              { label: "Start date", value: formatDate(project.startDate) },
              { label: "End date", value: formatDate(project.endDate) },
              {
                label: "Created by",
                value: creator ? `${creator.name} (${creator.email})` : "Unknown",
              },
              { label: "Last updated", value: formatDate(project.updatedAt) },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                <dd className="text-sm font-medium text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Completion</span>
              <span className="font-semibold text-slate-900">{percentage}%</span>
            </div>
            <ProgressBar value={percentage} />
          </div>
        </div>

        {/* Related tasks */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-base font-semibold text-slate-900">Related tasks</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
              {projectTasks.length}
            </span>
          </div>
          {projectTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
              <svg className="h-10 w-10 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm text-slate-500">No related tasks yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projectTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-900 text-sm">{task.title}</p>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>
                  {task.description && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-1">{task.description}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">Due: {formatDate(task.dueDate)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
