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
  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (startDate < today || endDate < today) {
      setError("Project dates cannot be in the past.");
      return;
    }

    if (endDate < startDate) {
      setError("End date cannot be before start date.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        isEditing ? `/api/projects/${project?.id}` : "/api/projects",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description, startDate, endDate, status }),
        }
      );
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

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-400";

  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Name */}
      <div>
        <label htmlFor="project-name" className={labelClass}>
          Project name <span className="text-rose-500">*</span>
        </label>
        <input
          id="project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Mobile App Redesign"
          required
          className={inputClass}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="project-description" className={labelClass}>
          Description
        </label>
        <textarea
          id="project-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Describe the project goals and scope…"
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Dates */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="project-start-date" className={labelClass}>
            Start date <span className="text-rose-500">*</span>
          </label>
          <input
            id="project-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            min={today}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="project-end-date" className={labelClass}>
            End date <span className="text-rose-500">*</span>
          </label>
          <input
            id="project-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            min={startDate || today}
            className={inputClass}
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="project-status" className={labelClass}>
          Status
        </label>
        <select
          id="project-status"
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
          ) : isEditing ? (
            "Save changes"
          ) : (
            "Create project"
          )}
        </button>
        <Link
          href={isEditing ? `/projects/${project?.id}` : "/projects"}
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
