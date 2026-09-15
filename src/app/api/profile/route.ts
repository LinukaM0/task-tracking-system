import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getTaskUser } from "@/lib/task-management";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Full name must be at least 2 characters").max(255),
});

export async function PUT(request: Request) {
  try {
    const user = await getTaskUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = profileSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid profile data" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(users)
      .set({
        name: result.data.name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

    return NextResponse.json({ user: updated });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
    }

    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Unable to update profile" }, { status: 500 });
  }
}
