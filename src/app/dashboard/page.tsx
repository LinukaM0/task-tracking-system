import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-md">
        <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
          Dashboard
        </p>

        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          Welcome, {session.user.name || session.user.email}
        </h1>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">User ID</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {session.user.id}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Role</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {session.user.role}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
