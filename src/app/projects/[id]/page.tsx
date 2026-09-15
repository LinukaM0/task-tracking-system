import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import DeleteProjectButton from "@/components/projects/DeleteProjectButton";
import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import { canDeleteProjects, canManageProjects, formatDate, getProjectUser } from "@/lib/project-management";

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getProjectUser();
  if (!user) redirect("/login");

  const projectId = Number((await params).id);
  if (!Number.isInteger(projectId) || projectId < 1) notFound();
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) notFound();

  const allProjectTasks = await db.select().from(tasks).where(eq(tasks.projectId, projectId));
  if (user.role === "DEVELOPER" && !allProjectTasks.some((task) => task.assignedTo !== null && Number(task.assignedTo) === user.id)) notFound();
  const projectTasks = user.role === "DEVELOPER"
    ? allProjectTasks.filter((task) => task.assignedTo === user.id)
    : allProjectTasks;

  const creator = project.createdBy
    ? (await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, project.createdBy)).limit(1))[0]
    : null;
  const completed = projectTasks.filter((task) => task.status === "COMPLETED").length;
  const percentage = projectTasks.length === 0 ? 0 : Math.round((completed / projectTasks.length) * 100);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/projects" className="text-sm font-medium text-blue-600 hover:underline">Back to projects</Link>
        <header className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold">{project.name}</h1><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{project.status.replace("_", " ")}</span></div>
              <p className="mt-3 max-w-3xl text-slate-600">{project.description || "No description provided"}</p>
            </div>
            <div className="flex flex-wrap gap-3">{canManageProjects(user.role) ? <Link href={`/projects/${project.id}/edit`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Edit project</Link> : null}{canDeleteProjects(user.role) ? <DeleteProjectButton projectId={project.id} /> : null}</div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Task count", projectTasks.length],
            ["TODO", projectTasks.filter((task) => task.status === "TODO").length],
            ["In progress", projectTasks.filter((task) => task.status === "IN_PROGRESS").length],
            ["Completed", completed],
            ["Completion", `${percentage}%`],
          ].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.5fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Project information</h2>
            <dl className="mt-5 space-y-4 text-sm"><div><dt className="text-slate-500">Start date</dt><dd className="mt-1 font-medium">{formatDate(project.startDate)}</dd></div><div><dt className="text-slate-500">End date</dt><dd className="mt-1 font-medium">{formatDate(project.endDate)}</dd></div><div><dt className="text-slate-500">Created by</dt><dd className="mt-1 font-medium">{creator ? `${creator.name} (${creator.email})` : "Unknown"}</dd></div><div><dt className="text-slate-500">Last updated</dt><dd className="mt-1 font-medium">{formatDate(project.updatedAt)}</dd></div></dl>
            <div className="mt-6"><div className="mb-2 flex justify-between text-sm"><span className="font-medium">Completion</span><span className="text-slate-500">{percentage}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${percentage}%` }} /></div></div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Related tasks</h2><span className="text-sm text-slate-500">Task management is handled separately</span></div>
            {projectTasks.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">No related tasks yet.</div> : <div className="mt-5 space-y-3">{projectTasks.map((task) => <div key={task.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-medium">{task.title}</p><div className="flex gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{task.status.replace("_", " ")}</span><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{task.priority}</span></div></div><p className="mt-2 text-sm text-slate-500">{task.description || "No description provided"}</p><p className="mt-2 text-xs text-slate-500">Due: {formatDate(task.dueDate)}</p></div>)}</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
