import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getTaskUser } from "@/lib/task-management";

const updateSchema = z.object({ name: z.string().trim().min(2).max(255), email: z.string().trim().toLowerCase().email(), role: z.enum(["ADMIN", "MANAGER", "DEVELOPER"]), password: z.string().min(6).optional() });

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getTaskUser();
    const id = Number((await params).id);
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (actor.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    const result = updateSchema.safeParse(await request.json());
    if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? "Invalid user data" }, { status: 400 });
    const values = { name: result.data.name, email: result.data.email, role: result.data.role, updatedAt: new Date(), ...(result.data.password ? { password: await bcrypt.hash(result.data.password, 12) } : {}) };
    const [updated] = await db.update(users).set(values).where(eq(users.id, id)).returning({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt, updatedAt: users.updatedAt });
    if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: "Unable to update user" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getTaskUser();
    const id = Number((await params).id);
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (actor.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    if (id === actor.id) return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    const [deleted] = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
    if (!deleted) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    console.error("User deletion error:", error);
    return NextResponse.json({ error: "Unable to delete user" }, { status: 500 });
  }
}
