import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getTaskUser } from "@/lib/task-management";

const userSchema = z.object({
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "MANAGER", "DEVELOPER"]),
});

export async function GET() {
  const user = await getTaskUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const records = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt, updatedAt: users.updatedAt }).from(users);
  return NextResponse.json({ users: records });
}

export async function POST(request: Request) {
  try {
    const user = await getTaskUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    const result = userSchema.safeParse(await request.json());
    if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? "Invalid user data" }, { status: 400 });
    const [created] = await db.insert(users).values({ ...result.data, password: await bcrypt.hash(result.data.password, 12) }).returning({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt, updatedAt: users.updatedAt });
    return NextResponse.json({ user: created }, { status: 201 });
  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json({ error: "Unable to create user" }, { status: 500 });
  }
}
