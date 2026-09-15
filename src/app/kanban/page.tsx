import Link from "next/link";
import { redirect } from "next/navigation";

import TaskStatusButton from "@/components/tasks/TaskStatusButton";
import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import { canManageTasks, formatTaskDate, getTaskUser } from "@/lib/task-management";

const columns = ["TODO", "IN_PROGRESS", "COMPLETED"] as const;

export default async function KanbanPage() {
  const user = await getTaskUser();
  if (!user) redirect("/login");
  const [taskRows, projectRows, userRows] = await Promise.all([db.select().from(tasks), db.select({ id: projects.id, name: projects.name }).from(projects), db.select({ id: users.id, name: users.name }).from(users)]);
  const projectNames = new Map(projectRows.map((project) => [project.id, project.name]));
  const userNames = new Map(userRows.map((account) => [account.id, account.name]));
  const visible = taskRows.filter((task) => user.role !== "DEVELOPER" || task.assignedTo === user.id);
  return <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900"><div className="mx-auto max-w-7xl"><header className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Workflow</p><h1 className="mt-2 text-3xl font-bold">Kanban board</h1><p className="mt-2 text-sm text-slate-600">Move tasks between workflow states with the status control on each card.</p></header><div className="grid gap-5 lg:grid-cols-3">{columns.map((column) => <section key={column} className="min-h-96 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{column.replace("_", " ")}</h2><span className="rounded-full bg-white px-2 py-1 text-xs text-slate-500">{visible.filter((task) => task.status === column).length}</span></div><div className="space-y-3">{visible.filter((task) => task.status === column).map((task) => <article key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-2"><Link href={`/tasks/${task.id}`} className="font-medium text-blue-600 hover:underline">{task.title}</Link><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">{task.priority}</span></div><p className="mt-2 text-xs text-slate-500">{projectNames.get(task.projectId) ?? "Unknown project"}</p><p className="mt-1 text-xs text-slate-500">{task.assignedTo ? userNames.get(task.assignedTo) ?? "Unknown" : "Unassigned"} · Due {formatTaskDate(task.dueDate)}</p>{canManageTasks(user.role) || task.assignedTo === user.id ? <div className="mt-3"><TaskStatusButton taskId={task.id} status={task.status} /></div> : null}</article>)}</div></section>)}</div></div></main>;
}
