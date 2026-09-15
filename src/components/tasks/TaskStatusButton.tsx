"use client";

import { useRouter } from "next/navigation";

export default function TaskStatusButton({
  taskId,
  status,
}: {
  taskId: number;
  status: string;
}) {
  const router = useRouter();

  async function change(nextStatus: string) {
    const response = await fetch(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (response.ok) router.refresh();
  }

  return (
    <select
      aria-label="Task status"
      value={status}
      onChange={(e) => change(e.target.value)}
      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-300 transition-colors cursor-pointer"
    >
      <option value="TODO">To Do</option>
      <option value="IN_PROGRESS">In Progress</option>
      <option value="COMPLETED">Completed</option>
    </select>
  );
}
