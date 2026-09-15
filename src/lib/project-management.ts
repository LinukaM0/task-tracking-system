import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

export const projectStatuses = ["PLANNED", "IN_PROGRESS", "COMPLETED"] as const;

export const projectInputSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required"),
    description: z.string().trim().max(5000, "Description is too long").optional(),
    startDate: z.string().trim().min(1, "Start date is required").refine(isDate, "Start date is invalid"),
    endDate: z.string().trim().min(1, "End date is required").refine(isDate, "End date is invalid"),
    status: z.enum(projectStatuses, { message: "Project status is invalid" }),
  })
  .refine((input) => new Date(input.endDate) >= new Date(input.startDate), {
    message: "End date cannot be before start date",
    path: ["endDate"],
  });

function isDate(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

export function toProjectValues(input: z.infer<typeof projectInputSchema>) {
  return {
    name: input.name,
    description: input.description || null,
    startDate: new Date(`${input.startDate}T00:00:00`),
    endDate: new Date(`${input.endDate}T00:00:00`),
    status: input.status,
  };
}

export async function getProjectUser() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);

  if (!session?.user || !userId) return null;

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

export function canManageProjects(role: string) {
  return role === "ADMIN" || role === "MANAGER";
}

export function canDeleteProjects(role: string) {
  return role === "ADMIN";
}

export function serializeDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export function formatDate(value: Date | null) {
  return value
    ? value.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not set";
}
