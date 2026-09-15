"use client";

import { useRouter } from "next/navigation";

export default function TaskStatusButton({ taskId, status }: { taskId: number; status: string }) {
  const router = useRouter();
  async function change(nextStatus: string) {
    const response = await fetch(`/api/tasks/${taskId}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
    if (response.ok) router.refresh();
  }
  return <select aria-label="Task status" value={status} onChange={(event) => change(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"><option value="TODO">TODO</option><option value="IN_PROGRESS">IN PROGRESS</option><option value="COMPLETED">COMPLETED</option></select>;
}
