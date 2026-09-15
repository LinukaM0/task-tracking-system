import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import ProjectForm from "@/components/projects/ProjectForm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import {
  canManageProjects,
  getProjectUser,
  serializeDate,
} from "@/lib/project-management";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getProjectUser();
  if (!user) redirect("/login");
  if (!canManageProjects(user.role)) redirect("/projects");

  const projectId = Number((await params).id);
  if (!Number.isInteger(projectId) || projectId < 1) notFound();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!project) notFound();

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to project
        </Link>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
          Project management
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Edit project</h1>
        <p className="mt-1 text-sm text-slate-500">
          Update the project information and schedule.
        </p>
      </div>
      <ProjectForm
        project={{
          id: project.id,
          name: project.name,
          description: project.description,
          startDate: serializeDate(project.startDate),
          endDate: serializeDate(project.endDate),
          status: project.status,
        }}
      />
    </div>
  );
}
