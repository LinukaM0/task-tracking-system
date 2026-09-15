import { redirect } from "next/navigation";

import ProjectForm from "@/components/projects/ProjectForm";
import { canManageProjects, getProjectUser } from "@/lib/project-management";

export default async function NewProjectPage() {
  const user = await getProjectUser();
  if (!user) redirect("/login");
  if (!canManageProjects(user.role)) redirect("/projects");

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Project management</p>
        <h1 className="mt-2 text-3xl font-bold">Create project</h1>
        <p className="mt-2 mb-6 text-sm text-slate-600">Set the project scope, schedule, and current status.</p>
        <ProjectForm />
      </div>
    </main>
  );
}
