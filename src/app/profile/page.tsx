import { redirect } from "next/navigation";

import ProfileCard from "@/components/profile/ProfileCard";
import { getTaskUser } from "@/lib/task-management";

export default async function ProfilePage() {
  const user = await getTaskUser();
  if (!user) redirect("/login");

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
          Account
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your account information and role settings.
        </p>
      </div>

      <ProfileCard user={user} />
    </div>
  );
}
