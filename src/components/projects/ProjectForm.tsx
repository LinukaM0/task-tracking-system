"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const statuses = ["PLANNED", "IN_PROGRESS", "COMPLETED"] as const;

type ProjectFormValues = {
  id?: number;
  name?: string;
  description?: string | null;
  startDate?: string;
  endDate?: string;
  status?: string;
};

export default function ProjectForm({ project }: { project?: ProjectFormValues }) {
  const router = useRouter();
  const isEditing = Boolean(project?.id);
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [startDate, setStartDate] = useState(project?.startDate ?? "");
  const [endDate, setEndDate] = useState(project?.endDate ?? "");
  const [status, setStatus] = useState(project?.status ?? "PLANNED");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(isEditing ? `/api/projects/${project?.id}` : "/api/projects", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, startDate, endDate, status }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to save project");
        return;
      }

      router.push(`/projects/${data.project.id}`);
      router.refresh();
    } catch {
      setError("Unable to save project. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="project-name" className="mb-1 block text-sm font-medium text-slate-700">Name</label>
        <input id="project-name" value={name} onChange={(event) => setName(event.target.value)} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label htmlFor="project-description" className="mb-1 block text-sm font-medium text-slate-700">Description</label>
        <textarea id="project-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={5} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="project-start-date" className="mb-1 block text-sm font-medium text-slate-700">Start date</label>
          <input id="project-start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="project-end-date" className="mb-1 block text-sm font-medium text-slate-700">End date</label>
          <input id="project-end-date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label htmlFor="project-status" className="mb-1 block text-sm font-medium text-slate-700">Status</label>
        <select id="project-status" value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
          {statuses.map((projectStatus) => <option key={projectStatus} value={projectStatus}>{projectStatus.replace("_", " ")}</option>)}
        </select>
      </div>

      {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Saving..." : isEditing ? "Save changes" : "Create project"}
        </button>
        <Link href={isEditing ? `/projects/${project?.id}` : "/projects"} className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </Link>
      </div>
    </form>
  );
}
