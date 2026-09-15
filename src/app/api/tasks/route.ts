import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import { canManageTasks, getTaskUser, taskInputSchema, toTaskValues, validateTaskRelations } from "@/lib/task-management";

export async function GET(request: Request) {
  try {
    const user = await getTaskUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = new URL(request.url).searchParams;
    const search = params.get("search")?.trim() ?? "";
    const status = params.get("status") ?? "ALL";
    const priority = params.get("priority") ?? "ALL";
    const projectId = Number(params.get("projectId"));
    const assignedTo = Number(params.get("assignedTo"));
    const sort = params.get("sort") ?? "newest";

    const [taskRows, projectRows, userRows] = await Promise.all([
      db.select().from(tasks),
      db.select({ id: projects.id, name: projects.name }).from(projects),
      db.select({ id: users.id, name: users.name }).from(users),
    ]);
    const projectNames = new Map(projectRows.map((project) => [project.id, project.name]));
    const userNames = new Map(userRows.map((account) => [account.id, account.name]));

    const visible = taskRows.filter((task) => {
      const relevant = user.role !== "DEVELOPER" || task.assignedTo === user.id;
      return relevant && (!search || task.title.toLowerCase().includes(search)) &&
        (status === "ALL" || task.status === status) &&
        (priority === "ALL" || task.priority === priority) &&
        (!Number.isInteger(projectId) || projectId < 1 || task.projectId === projectId) &&
        (!Number.isInteger(assignedTo) || assignedTo < 1 || task.assignedTo === assignedTo);
    });

    visible.sort((a, b) => {
      if (sort === "dueDate") return (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity);
      if (sort === "priority") return ["URGENT", "HIGH", "MEDIUM", "LOW"].indexOf(a.priority) - ["URGENT", "HIGH", "MEDIUM", "LOW"].indexOf(b.priority);
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return NextResponse.json({
      tasks: visible.map((task) => ({ ...task, projectName: projectNames.get(task.projectId) ?? "Unknown", assignedToName: task.assignedTo ? userNames.get(task.assignedTo) ?? "Unknown" : "Unassigned" })),
    });
  } catch (error) {
    console.error("Task list error:", error);
    return NextResponse.json({ error: "Unable to load tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getTaskUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageTasks(user.role)) return NextResponse.json({ error: "You are not allowed to create tasks" }, { status: 403 });

    const result = taskInputSchema.safeParse(await request.json());
    if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? "Invalid task data" }, { status: 400 });
    const relationError = await validateTaskRelations(result.data.projectId, result.data.assignedTo);
    if (relationError) return NextResponse.json({ error: relationError }, { status: 400 });

    const [task] = await db.insert(tasks).values({ ...toTaskValues(result.data), createdBy: user.id }).returning();
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Task creation error:", error);
    return NextResponse.json({ error: "Unable to create task" }, { status: 500 });
  }
}
