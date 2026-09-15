"use client";

import { useRouter } from "next/navigation";

export default function TaskDeleteButton({ taskId }: { taskId: number }) {
  const router = useRouter();
  async function remove() {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (response.ok) router.push("/tasks");
  }
  return <button type="button" onClick={remove} className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">Delete task</button>;
}
