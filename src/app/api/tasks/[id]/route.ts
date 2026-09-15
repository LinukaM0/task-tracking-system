import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import { canDeleteTasks, canEditTask, getTaskUser, taskInputSchema, toTaskValues, validateTaskRelations } from "@/lib/task-management";

async function taskId(params: Promise<{ id: string }>) {
  const id = Number((await params).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function getTask(id: number) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!task) return null;
  const [project] = await db.select({ id: projects.id, name: projects.name }).from(projects).where(eq(projects.id, task.projectId)).limit(1);
  const [assignee] = task.assignedTo ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, task.assignedTo)).limit(1) : [];
  const [creator] = task.createdBy ? await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, task.createdBy)).limit(1) : [];
  return { ...task, project, assignee: assignee ?? null, creator: creator ?? null };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getTaskUser();
    const id = await taskId(params);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!id) return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
    const task = await getTask(id);
    if (!task || (user.role === "DEVELOPER" && task.assignedTo !== user.id)) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ task });
  } catch (error) {
    console.error("Task details error:", error);
    return NextResponse.json({ error: "Unable to load task" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getTaskUser();
    const id = await taskId(params);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!id) return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
    const [existing] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    if (!canEditTask(user.role, user.id, existing)) return NextResponse.json({ error: "Only admins and managers can edit task details" }, { status: 403 });

    const body = await request.json();
    const result = taskInputSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? "Invalid task data" }, { status: 400 });
    const relationError = await validateTaskRelations(result.data.projectId, result.data.assignedTo);
    if (relationError) return NextResponse.json({ error: relationError }, { status: 400 });
    const [task] = await db.update(tasks).set({ ...toTaskValues(result.data), updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
    return NextResponse.json({ task });
  } catch (error) {
    console.error("Task update error:", error);
    return NextResponse.json({ error: "Unable to update task" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getTaskUser();
    const id = await taskId(params);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!id || !canDeleteTasks(user.role)) return NextResponse.json({ error: "You are not allowed to delete this task" }, { status: 403 });
    const [deleted] = await db.delete(tasks).where(eq(tasks.id, id)).returning({ id: tasks.id });
    if (!deleted) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ message: "Task deleted" });
  } catch (error) {
    console.error("Task deletion error:", error);
    return NextResponse.json({ error: "Unable to delete task" }, { status: 500 });
  }
}
