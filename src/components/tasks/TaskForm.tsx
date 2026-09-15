"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const statuses = ["TODO", "IN_PROGRESS", "COMPLETED"];
const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

type Option = { id: number; name: string };
type TaskValue = { id?: number; title?: string; description?: string | null; projectId?: number; assignedTo?: number | null; status?: string; priority?: string; dueDate?: string | null };

export default function TaskForm({ task, projects, developers }: { task?: TaskValue; projects: Option[]; developers: Option[] }) {
  const router = useRouter();
  const editing = Boolean(task?.id);
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [projectId, setProjectId] = useState(String(task?.projectId ?? projects[0]?.id ?? ""));
  const [assignedTo, setAssignedTo] = useState(String(task?.assignedTo ?? ""));
  const [status, setStatus] = useState(task?.status ?? "TODO");
  const [priority, setPriority] = useState(task?.priority ?? "MEDIUM");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(editing ? `/api/tasks/${task?.id}` : "/api/tasks", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, projectId, assignedTo, status, priority, dueDate }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "Unable to save task"); return; }
      router.push(`/tasks/${data.task.id}`);
      router.refresh();
    } catch { setError("Unable to save task. Please try again."); } finally { setLoading(false); }
  }

  return <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div><label htmlFor="task-title" className="mb-1 block text-sm font-medium text-slate-700">Title</label><input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900" /></div>
    <div><label htmlFor="task-description" className="mb-1 block text-sm font-medium text-slate-700">Description</label><textarea id="task-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900" /></div>
    <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="task-project" className="mb-1 block text-sm font-medium text-slate-700">Project</label><select id="task-project" value={projectId} onChange={(event) => setProjectId(event.target.value)} required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900">{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div><div><label htmlFor="task-assignee" className="mb-1 block text-sm font-medium text-slate-700">Assigned developer</label><select id="task-assignee" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="">Unassigned</option>{developers.map((developer) => <option key={developer.id} value={developer.id}>{developer.name}</option>)}</select></div></div>
    <div className="grid gap-5 sm:grid-cols-3"><div><label htmlFor="task-status" className="mb-1 block text-sm font-medium text-slate-700">Status</label><select id="task-status" value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900">{statuses.map((value) => <option key={value} value={value}>{value.replace("_", " ")}</option>)}</select></div><div><label htmlFor="task-priority" className="mb-1 block text-sm font-medium text-slate-700">Priority</label><select id="task-priority" value={priority} onChange={(event) => setPriority(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900">{priorities.map((value) => <option key={value} value={value}>{value}</option>)}</select></div><div><label htmlFor="task-due-date" className="mb-1 block text-sm font-medium text-slate-700">Due date</label><input id="task-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900" /></div></div>
    {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}<div className="flex gap-3"><button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50">{loading ? "Saving..." : editing ? "Save changes" : "Create task"}</button><Link href={editing ? `/tasks/${task?.id}` : "/tasks"} className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700">Cancel</Link></div>
  </form>;
}
