"use client";

import { useRouter } from "next/navigation";

export default function TaskDeleteButton({ taskId }: { taskId: number }) {
  const router = useRouter();

  async function remove() {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (response.ok) router.push("/tasks");
  }

  return (
    <button
      type="button"
      onClick={remove}
      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 active:scale-[0.98] transition-all"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <polyline points="3 6 5 6 21 6" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m5 0V4a1 1 0 011-1h2a1 1 0 011 1v2"
        />
      </svg>
      Delete task
    </button>
  );
}
