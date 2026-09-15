import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import ProjectForm from "@/components/projects/ProjectForm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { canManageProjects, getProjectUser, serializeDate } from "@/lib/project-management";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getProjectUser();
  if (!user) redirect("/login");
  if (!canManageProjects(user.role)) redirect("/projects");

  const projectId = Number((await params).id);
  if (!Number.isInteger(projectId) || projectId < 1) notFound();
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) notFound();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Project management</p>
        <h1 className="mt-2 text-3xl font-bold">Edit project</h1>
        <p className="mt-2 mb-6 text-sm text-slate-600">Update the project information and schedule.</p>
        <ProjectForm project={{ id: project.id, name: project.name, description: project.description, startDate: serializeDate(project.startDate), endDate: serializeDate(project.endDate), status: project.status }} />
      </div>
    </main>
  );
}
