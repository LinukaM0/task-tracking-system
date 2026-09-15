import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import { canManageProjects, formatDate, getProjectUser } from "@/lib/project-management";

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
      const relevant = user.role !== "DEVELOPER" || projectTasks.some(
        (task) => task.assignedTo !== null && Number(task.assignedTo) === user.id
      );
      const matchesSearch = !search || `${project.name} ${project.description ?? ""}`.toLowerCase().includes(search);
      return relevant && matchesSearch && (status === "ALL" || project.status === status);
    })
    .sort((firstProject, secondProject) => {
      if (sort === "name") return firstProject.name.localeCompare(secondProject.name);
      if (sort === "oldest") return firstProject.createdAt.getTime() - secondProject.createdAt.getTime();
      if (sort === "endDate") return (firstProject.endDate?.getTime() ?? Infinity) - (secondProject.endDate?.getTime() ?? Infinity);
      return secondProject.createdAt.getTime() - firstProject.createdAt.getTime();
    });

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Project management</p>
            <h1 className="mt-2 text-3xl font-bold">Projects</h1>
            <p className="mt-2 text-sm text-slate-600">Browse the projects available to your role.</p>
          </div>
          {canManageProjects(user.role) ? <Link href="/projects/new" className="rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white hover:bg-blue-700">New project</Link> : null}
        </header>

        <form className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_180px_auto]" method="get">
          <input name="search" defaultValue={filters.search ?? ""} placeholder="Search projects" className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
          <select name="status" defaultValue={status} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900">
            <option value="ALL">All statuses</option>
            <option value="PLANNED">Planned</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select name="sort" defaultValue={sort} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
            <option value="endDate">End date</option>
          </select>
          <button type="submit" className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50">Apply</button>
        </form>

        {visibleProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No projects match your filters.</div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {visibleProjects.map((project) => {
              const projectTasks = taskRows.filter((task) => task.projectId === project.id);
              const completedTasks = projectTasks.filter((task) => task.status === "COMPLETED").length;
              const percentage = projectTasks.length === 0 ? 0 : Math.round((completedTasks / projectTasks.length) * 100);
              return (
                <article key={project.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold"><Link href={`/projects/${project.id}`} className="hover:text-blue-600">{project.name}</Link></h2>
                      <p className="mt-2 text-sm text-slate-600">{project.description || "No description provided"}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{project.status.replace("_", " ")}</span>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    <div><dt className="text-slate-500">Start</dt><dd className="mt-1 font-medium">{formatDate(project.startDate)}</dd></div>
                    <div><dt className="text-slate-500">End</dt><dd className="mt-1 font-medium">{formatDate(project.endDate)}</dd></div>
                    <div><dt className="text-slate-500">Created by</dt><dd className="mt-1 font-medium">{project.createdBy ? creatorNames.get(project.createdBy) ?? "Unknown" : "Unknown"}</dd></div>
                    <div><dt className="text-slate-500">Tasks</dt><dd className="mt-1 font-medium">{projectTasks.length}</dd></div>
                  </dl>
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-sm"><span className="font-medium">Completion</span><span className="text-slate-500">{percentage}%</span></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${percentage}%` }} /></div>
                  </div>
                  <div className="mt-5 flex gap-3"><Link href={`/projects/${project.id}`} className="text-sm font-medium text-blue-600 hover:underline">View details</Link>{canManageProjects(user.role) ? <Link href={`/projects/${project.id}/edit`} className="text-sm font-medium text-slate-600 hover:underline">Edit</Link> : null}</div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
