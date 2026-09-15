import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import {
  canManageProjects,
  getProjectUser,
  projectInputSchema,
  toProjectValues,
} from "@/lib/project-management";

function projectSummary(project: typeof projects.$inferSelect, projectTasks: typeof tasks.$inferSelect[], creatorName: string | null) {
  const completedTasks = projectTasks.filter((task) => task.status === "COMPLETED").length;

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    startDate: project.startDate,
    endDate: project.endDate,
    status: project.status,
    createdBy: project.createdBy,
    createdByName: creatorName,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    taskCount: projectTasks.length,
    completionPercentage:
      projectTasks.length === 0 ? 0 : Math.round((completedTasks / projectTasks.length) * 100),
  };
}

export async function GET(request: Request) {
  try {
    const user = await getProjectUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = new URL(request.url).searchParams;
    const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
    const status = searchParams.get("status") ?? "ALL";
    const sort = searchParams.get("sort") ?? "newest";

    const [projectRows, taskRows, userRows] = await Promise.all([
      db.select().from(projects),
      db.select().from(tasks),
      db.select({ id: users.id, name: users.name }).from(users),
    ]);

    const creatorNames = new Map(userRows.map((row) => [row.id, row.name]));
    const visibleProjects = projectRows.filter((project) => {
      const projectTasks = taskRows.filter((task) => task.projectId === project.id);
      const isRelevant = user.role !== "DEVELOPER" || projectTasks.some(
        (task) => task.assignedTo !== null && Number(task.assignedTo) === user.id
      );
      const matchesSearch = !search || `${project.name} ${project.description ?? ""}`.toLowerCase().includes(search);
      const matchesStatus = status === "ALL" || project.status === status;
      return isRelevant && matchesSearch && matchesStatus;
    });

    visibleProjects.sort((firstProject, secondProject) => {
      if (sort === "name") return firstProject.name.localeCompare(secondProject.name);
      if (sort === "oldest") return firstProject.createdAt.getTime() - secondProject.createdAt.getTime();
      if (sort === "endDate") return (firstProject.endDate?.getTime() ?? Infinity) - (secondProject.endDate?.getTime() ?? Infinity);
      return secondProject.createdAt.getTime() - firstProject.createdAt.getTime();
    });

    return NextResponse.json({
      projects: visibleProjects.map((project) =>
        projectSummary(
          project,
          taskRows.filter((task) => task.projectId === project.id),
          project.createdBy ? creatorNames.get(project.createdBy) ?? null : null
        )
      ),
    });
  } catch (error) {
    console.error("Project list error:", error);
    return NextResponse.json({ error: "Unable to load projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getProjectUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageProjects(user.role)) {
      return NextResponse.json({ error: "You are not allowed to create projects" }, { status: 403 });
    }

    const result = projectInputSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message ?? "Invalid project data" }, { status: 400 });
    }

    const [project] = await db
      .insert(projects)
      .values({ ...toProjectValues(result.data), createdBy: user.id })
      .returning();

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Project creation error:", error);
    return NextResponse.json({ error: "Unable to create project" }, { status: 500 });
  }
}
