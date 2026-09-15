import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { tasks } from "@/db/schema";
import { canUpdateTaskStatus, getTaskUser, taskStatuses } from "@/lib/task-management";

const statusSchema = z.object({ status: z.enum(taskStatuses) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getTaskUser();
    const id = Number((await params).id);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    if (!canUpdateTaskStatus(user.role, user.id, task)) return NextResponse.json({ error: "You are not allowed to update this task" }, { status: 403 });
    const result = statusSchema.safeParse(await request.json());
    if (!result.success) return NextResponse.json({ error: "Invalid task status" }, { status: 400 });
    const [updated] = await db.update(tasks).set({ status: result.data.status, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error("Task status error:", error);
    return NextResponse.json({ error: "Unable to update task status" }, { status: 500 });
  }
}
