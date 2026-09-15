"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const statuses = ["TODO", "IN_PROGRESS", "COMPLETED"];
const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

type Option = { id: number; name: string };
type TaskValue = {
  id?: number;
  title?: string;
  description?: string | null;
  projectId?: number;
  assignedTo?: number | null;
  status?: string;
  priority?: string;
  dueDate?: string | null;
};

export default function TaskForm({
  task,
  projects,
  developers,
}: {
  task?: TaskValue;
  projects: Option[];
  developers: Option[];
}) {
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
  const today = new Date().toISOString().slice(0, 10);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (dueDate && dueDate < today) {
      setError("Due date cannot be in the past.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        editing ? `/api/tasks/${task?.id}` : "/api/tasks",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            projectId,
            assignedTo,
            status,
            priority,
            dueDate,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to save task");
        return;
      }
      router.push(`/tasks/${data.task.id}`);
      router.refresh();
    } catch {
      setError("Unable to save task. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-400";

  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Title */}
      <div>
        <label htmlFor="task-title" className={labelClass}>
          Title <span className="text-rose-500">*</span>
        </label>
        <input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Implement user authentication"
          className={inputClass}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="task-description" className={labelClass}>
          Description
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Describe what needs to be done…"
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Project + Assignee */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="task-project" className={labelClass}>
            Project <span className="text-rose-500">*</span>
          </label>
          <select
            id="task-project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            className={inputClass}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="task-assignee" className={labelClass}>
            Assigned developer
          </label>
          <select
            id="task-assignee"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className={inputClass}
          >
            <option value="">Unassigned</option>
            {developers.map((dev) => (
              <option key={dev.id} value={dev.id}>
                {dev.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status + Priority + Due date */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="task-status" className={labelClass}>
            Status
          </label>
          <select
            id="task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="task-priority" className={labelClass}>
            Priority
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className={inputClass}
          >
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="task-due-date" className={labelClass}>
            Due date
          </label>
          <input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={today}
            className={inputClass}
          />
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving…
            </>
          ) : editing ? (
            "Save changes"
          ) : (
            "Create task"
          )}
        </button>
        <Link
          href={editing ? `/tasks/${task?.id}` : "/tasks"}
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
