import { redirect } from "next/navigation";

import ProfileForm from "@/components/profile/ProfileForm";
import { getTaskUser } from "@/lib/task-management";

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-rose-100 text-rose-700",
  MANAGER: "bg-amber-100 text-amber-700",
  DEVELOPER: "bg-indigo-100 text-indigo-700",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function ProfilePage() {
  const user = await getTaskUser();
  if (!user) redirect("/login");

  const initials = getInitials(user.name);
  const roleStyle = ROLE_STYLES[user.role] ?? "bg-slate-100 text-slate-700";

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
          Account
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your account information and role.
        </p>
      </div>

      {/* Profile card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Avatar banner */}
        <div className="relative z-0 h-24 bg-gradient-to-r from-indigo-600 to-violet-600" />
        <div className="relative z-10 px-6 pb-6">
          {/* Avatar */}
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <div className="relative z-20 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-indigo-100 text-2xl font-bold text-indigo-700 shadow-md select-none">
              {initials}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${roleStyle}`}>
              {user.role}
            </span>
          </div>

          {/* Name */}
          <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{user.email}</p>

          <ProfileForm name={user.name} email={user.email} role={user.role} />
        </div>
      </div>
    </div>
  );
}
