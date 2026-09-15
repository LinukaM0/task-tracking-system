import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import {
  canDeleteProjects,
  canManageProjects,
  getProjectUser,
  projectInputSchema,
  toProjectValues,
} from "@/lib/project-management";

async function getProjectId(params: Promise<{ id: string }>) {
  const id = Number((await params).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function getProjectData(projectId: number) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) return null;

  const [projectTasks, creator] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.projectId, projectId)),
    project.createdBy
      ? db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, project.createdBy)).limit(1)
      : Promise.resolve([]),
  ]);

  const completed = projectTasks.filter((task) => task.status === "COMPLETED").length;

  return {
    ...project,
    creator: creator[0] ?? null,
    tasks: projectTasks,
    statistics: {
      total: projectTasks.length,
      todo: projectTasks.filter((task) => task.status === "TODO").length,
      inProgress: projectTasks.filter((task) => task.status === "IN_PROGRESS").length,
      completed,
      completionPercentage: projectTasks.length === 0 ? 0 : Math.round((completed / projectTasks.length) * 100),
    },
  };
}

async function canViewProject(projectId: number, userId: number, role: string) {
  if (role !== "DEVELOPER") return true;

  const [assignedTask] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.assignedTo, userId)))
    .limit(1);

  return Boolean(assignedTask);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getProjectUser();
    const projectId = await getProjectId(params);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!projectId) return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
    if (!(await canViewProject(projectId, user.id, user.role))) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = await getProjectData(projectId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Project details error:", error);
    return NextResponse.json({ error: "Unable to load project" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getProjectUser();
    const projectId = await getProjectId(params);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!projectId) return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
    if (!canManageProjects(user.role)) {
      return NextResponse.json({ error: "You are not allowed to edit projects" }, { status: 403 });
    }

    const result = projectInputSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message ?? "Invalid project data" }, { status: 400 });
    }

    const [project] = await db
      .update(projects)
      .set({ ...toProjectValues(result.data), updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .returning();

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ project });
  } catch (error) {
    console.error("Project update error:", error);
    return NextResponse.json({ error: "Unable to update project" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getProjectUser();
    const projectId = await getProjectId(params);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!projectId) return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
    if (!canDeleteProjects(user.role)) {
      return NextResponse.json({ error: "Only admins can delete projects" }, { status: 403 });
    }

    await db.transaction(async (transaction) => {
      await transaction.delete(tasks).where(eq(tasks.projectId, projectId));
      await transaction.delete(projects).where(eq(projects.id, projectId));
    });

    return NextResponse.json({ message: "Project deleted" });
  } catch (error) {
    console.error("Project deletion error:", error);
    return NextResponse.json({ error: "Unable to delete project" }, { status: 500 });
  }
}
