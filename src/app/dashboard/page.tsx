import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import Link from "next/link";

import { authOptions } from "@/auth";
import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import {
  PriorityBadge,
  ProgressBar,
  SectionCard,
  StatCard,
  StatusBadge,
  EmptyState,
} from "@/components/dashboard/DashboardLayout";

function formatDate(value?: Date | string | null) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <p className="text-xs text-slate-400 shrink-0">{today}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const currentUserId = Number(session.user.id);
  if (!currentUserId) {
    redirect("/login");
  }

  try {
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, currentUserId))
      .limit(1);

    if (!currentUser) {
      redirect("/login");
    }

    const role = currentUser.role || "DEVELOPER";

    const allUsers = await db.select().from(users);
    const allProjects = await db.select().from(projects);
    const allTasks = await db.select().from(tasks);
    const projectNames = new Map(allProjects.map((p) => [p.id, p.name]));

    const recentProjects = [...allProjects]
      .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

    const recentTasks = [...allTasks]
      .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

    const todoTasks = allTasks.filter((t) => t.status === "TODO").length;
    const inProgressTasks = allTasks.filter((t) => t.status === "IN_PROGRESS").length;
    const completedTasks = allTasks.filter((t) => t.status === "COMPLETED").length;
    const overdueTasks = allTasks.filter((t) => {
      if (!t.dueDate || t.status === "COMPLETED") return false;
      return new Date(t.dueDate).getTime() < Date.now();
    }).length;

    const projectProgress = allProjects.map((project) => {
      const projectTasks = allTasks.filter((t) => Number(t.projectId) === project.id);
      const completed = projectTasks.filter((t) => t.status === "COMPLETED").length;
      const percentage = projectTasks.length === 0 ? 0 : Math.round((completed / projectTasks.length) * 100);
      return { id: project.id, name: project.name, percentage, totalTasks: projectTasks.length };
    });

    const developerProgress = allUsers
      .filter((u) => u.role === "DEVELOPER")
      .map((u) => {
        const userTasks = allTasks.filter(
          (t) => t.assignedTo !== null && Number(t.assignedTo) === u.id
        );
        const completed = userTasks.filter((t) => t.status === "COMPLETED").length;
        return {
          id: u.id,
          name: u.name,
          totalTasks: userTasks.length,
          progress: userTasks.length === 0 ? 0 : Math.round((completed / userTasks.length) * 100),
        };
      });

    const upcomingDeadlines = allTasks
      .filter((t) => t.dueDate && t.status !== "COMPLETED")
      .sort((a, b) => new Date(a.dueDate as Date).getTime() - new Date(b.dueDate as Date).getTime())
      .slice(0, 5);

    const developerAssignedTasks = allTasks.filter(
      (t) => t.assignedTo !== null && Number(t.assignedTo) === currentUserId
    );

    const myTodo = developerAssignedTasks.filter((t) => t.status === "TODO");
    const myInProgress = developerAssignedTasks.filter((t) => t.status === "IN_PROGRESS");
    const myCompleted = developerAssignedTasks.filter((t) => t.status === "COMPLETED");
    const myOverdue = developerAssignedTasks.filter((t) => {
      if (!t.dueDate || t.status === "COMPLETED") return false;
      return new Date(t.dueDate).getTime() < Date.now();
    });

    const userTaskSummary = {
      total: developerAssignedTasks.length,
      todo: myTodo.length,
      inProgress: myInProgress.length,
      completed: myCompleted.length,
      overdue: myOverdue.length,
    };

    /* ── ADMIN ──────────────────────────────────────────────────────── */
    if (role === "ADMIN") {
      return (
        <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto">
          <PageHeader
            eyebrow="Admin Dashboard"
            title={`Welcome, ${currentUser.name}`}
            subtitle="System overview for your team and project portfolio."
          />

          {/* Stats */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Users" value={allUsers.length} tone="bg-violet-100 text-violet-700" />
            <StatCard label="Total Projects" value={allProjects.length} tone="bg-indigo-100 text-indigo-700" />
            <StatCard label="Total Tasks" value={allTasks.length} tone="bg-sky-100 text-sky-700" />
            <StatCard label="Overdue" value={overdueTasks} tone="bg-rose-100 text-rose-700" />
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard label="To Do" value={todoTasks} tone="bg-slate-100 text-slate-700" />
            <StatCard label="In Progress" value={inProgressTasks} tone="bg-indigo-100 text-indigo-700" />
            <StatCard label="Completed" value={completedTasks} tone="bg-emerald-100 text-emerald-700" />
          </section>

          {/* Recent + Tasks */}
          <section className="grid gap-6 xl:grid-cols-2">
            <SectionCard
              title="Recent Projects"
              subtitle={`${recentProjects.length}`}
              action={
                <Link href="/projects" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  View all →
                </Link>
              }
            >
              {recentProjects.length === 0 ? (
                <EmptyState message="No projects yet. Create one to get started." />
              ) : (
                <div className="space-y-3">
                  {recentProjects.slice(0, 4).map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
                    >
                      <p className="text-sm font-medium text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                        {project.name}
                      </p>
                      <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                        {project.status.replace("_", " ")}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Recent Tasks"
              subtitle={`${recentTasks.length}`}
              action={
                <Link href="/tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  View all →
                </Link>
              }
            >
              {recentTasks.length === 0 ? (
                <EmptyState message="No tasks created yet." />
              ) : (
                <div className="space-y-3">
                  {recentTasks.slice(0, 4).map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {projectNames.get(task.projectId) ?? "Unknown project"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>
          </section>

          {/* Progress */}
          <section className="grid gap-6 xl:grid-cols-2">
            <SectionCard title="Project Progress" subtitle={`${projectProgress.length} projects`}>
              {projectProgress.length === 0 ? (
                <EmptyState message="No projects available." />
              ) : (
                <div className="space-y-5">
                  {projectProgress.slice(0, 5).map((project) => (
                    <div key={project.id}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 truncate mr-3">{project.name}</span>
                        <span className="shrink-0 font-semibold text-slate-600">{project.percentage}%</span>
                      </div>
                      <ProgressBar value={project.percentage} />
                      <p className="mt-1 text-xs text-slate-400">
                        {project.totalTasks} {project.totalTasks === 1 ? "task" : "tasks"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Task Status Breakdown">
              <div className="space-y-5">
                {[
                  { label: "To Do", value: todoTasks, color: "bg-slate-400" },
                  { label: "In Progress", value: inProgressTasks, color: "bg-indigo-500" },
                  { label: "Completed", value: completedTasks, color: "bg-emerald-500" },
                ].map((item) => {
                  const pct = allTasks.length === 0 ? 0 : Math.round((item.value / allTasks.length) * 100);
                  return (
                    <div key={item.label}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{item.label}</span>
                        <span className="text-slate-500">{item.value} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </section>

          {/* Team overview */}
          <SectionCard
            title="Developer Team Overview"
            subtitle={`${allUsers.filter((u) => u.role === "DEVELOPER").length} developers`}
            action={
              <Link href="/users" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                Manage users →
              </Link>
            }
          >
            {allUsers.filter((u) => u.role === "DEVELOPER").length === 0 ? (
              <EmptyState message="No developers added yet." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {allUsers.filter((u) => u.role === "DEVELOPER").map((u) => {
                  const userTasks = allTasks.filter(
                    (t) => t.assignedTo !== null && Number(t.assignedTo) === u.id
                  );
                  const completed = userTasks.filter((t) => t.status === "COMPLETED").length;
                  const percentage = userTasks.length === 0 ? 0 : Math.round((completed / userTasks.length) * 100);
                  const initials = u.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

                  return (
                    <div key={u.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold select-none">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate text-sm">{u.name}</p>
                          <p className="text-xs text-slate-500 truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                          <span>{userTasks.length} tasks</span>
                          <span>{percentage}% done</span>
                        </div>
                        <ProgressBar value={percentage} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      );
    }

    /* ── MANAGER ────────────────────────────────────────────────────── */
    if (role === "MANAGER") {
      return (
        <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto">
          <PageHeader
            eyebrow="Manager Dashboard"
            title={`Welcome, ${currentUser.name}`}
            subtitle="Track delivery progress across projects and your team."
          />

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Total Projects" value={allProjects.length} tone="bg-indigo-100 text-indigo-700" />
            <StatCard label="Total Tasks" value={allTasks.length} tone="bg-violet-100 text-violet-700" />
            <StatCard label="Overdue" value={overdueTasks} tone="bg-rose-100 text-rose-700" />
            <StatCard label="To Do" value={todoTasks} tone="bg-slate-100 text-slate-700" />
            <StatCard label="In Progress" value={inProgressTasks} tone="bg-indigo-100 text-indigo-700" />
            <StatCard label="Completed" value={completedTasks} tone="bg-emerald-100 text-emerald-700" />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <SectionCard title="Project Progress">
              {allProjects.length === 0 ? (
                <EmptyState message="No projects available for your team." />
              ) : (
                <div className="space-y-5">
                  {projectProgress.map((project) => (
                    <div key={project.id}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 truncate mr-3">{project.name}</span>
                        <span className="shrink-0 font-semibold text-slate-600">{project.percentage}%</span>
                      </div>
                      <ProgressBar value={project.percentage} />
                      <p className="mt-1 text-xs text-slate-400">{project.totalTasks} tasks</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Developer Task Progress">
              {developerProgress.length === 0 ? (
                <EmptyState message="No developers in the team yet." />
              ) : (
                <div className="space-y-5">
                  {developerProgress.map((person) => (
                    <div key={person.id}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{person.name}</span>
                        <span className="shrink-0 text-slate-500">{person.progress}%</span>
                      </div>
                      <ProgressBar value={person.progress} color="bg-gradient-to-r from-violet-500 to-indigo-500" />
                      <p className="mt-1 text-xs text-slate-400">{person.totalTasks} assigned tasks</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <SectionCard
              title="Assigned Tasks"
              subtitle={`${allTasks.filter((t) => t.assignedTo !== null).length}`}
            >
              {allTasks.filter((t) => t.assignedTo !== null).length === 0 ? (
                <EmptyState message="No assigned tasks yet." />
              ) : (
                <div className="space-y-3">
                  {allTasks.filter((t) => t.assignedTo !== null).slice(0, 6).map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
                    >
                      <p className="text-sm font-medium text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Upcoming Deadlines"
              subtitle={`${upcomingDeadlines.length}`}
            >
              {upcomingDeadlines.length === 0 ? (
                <EmptyState message="No upcoming deadlines." />
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Due: {formatDate(task.dueDate)}</p>
                      </div>
                      <StatusBadge status={task.status} />
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>
          </section>

          <SectionCard
            title="Recently Created Tasks"
            subtitle={`${recentTasks.length}`}
            action={
              <Link href="/tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                View all →
              </Link>
            }
          >
            {recentTasks.length === 0 ? (
              <EmptyState message="No tasks created yet." />
            ) : (
              <div className="space-y-3">
                {recentTasks.slice(0, 6).map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {projectNames.get(task.projectId) ?? "Unknown project"} · {formatDate(task.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={task.status} />
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      );
    }

    /* ── DEVELOPER ──────────────────────────────────────────────────── */
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto">
        <PageHeader
          eyebrow="Developer Dashboard"
          title={`Welcome, ${currentUser.name}`}
          subtitle="Your personal task and delivery overview."
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="My Tasks" value={userTaskSummary.total} tone="bg-indigo-100 text-indigo-700" />
          <StatCard label="To Do" value={userTaskSummary.todo} tone="bg-slate-100 text-slate-700" />
          <StatCard label="In Progress" value={userTaskSummary.inProgress} tone="bg-sky-100 text-sky-700" />
          <StatCard label="Completed" value={userTaskSummary.completed} tone="bg-emerald-100 text-emerald-700" />
          <StatCard label="Overdue" value={userTaskSummary.overdue} tone="bg-rose-100 text-rose-700" />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <SectionCard
            title="My Recent Tasks"
            subtitle={`${developerAssignedTasks.length}`}
            action={
              <Link href="/tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                View all →
              </Link>
            }
          >
            {developerAssignedTasks.length === 0 ? (
              <EmptyState message="No tasks assigned to you yet." />
            ) : (
              <div className="space-y-3">
                {developerAssignedTasks.slice(0, 5).map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
                  >
                    <p className="text-sm font-medium text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Upcoming Deadlines"
            subtitle={`${developerAssignedTasks.filter((t) => t.dueDate && t.status !== "COMPLETED").length}`}
          >
            {developerAssignedTasks.filter((t) => t.dueDate && t.status !== "COMPLETED").length === 0 ? (
              <EmptyState message="No active deadlines." />
            ) : (
              <div className="space-y-3">
                {developerAssignedTasks
                  .filter((t) => t.dueDate && t.status !== "COMPLETED")
                  .sort((a, b) => new Date(a.dueDate as Date).getTime() - new Date(b.dueDate as Date).getTime())
                  .slice(0, 5)
                  .map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Due: {formatDate(task.dueDate)}</p>
                      </div>
                      <StatusBadge status={task.status} />
                    </Link>
                  ))}
              </div>
            )}
          </SectionCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <SectionCard title="My Completion Rate">
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">
                    {developerAssignedTasks.length === 0
                      ? "0"
                      : Math.round((userTaskSummary.completed / developerAssignedTasks.length) * 100)}%
                  </p>
                  <p className="mt-1 text-sm text-slate-500">of tasks completed</p>
                </div>
                <p className="text-sm text-slate-500 text-right">
                  {userTaskSummary.completed} / {developerAssignedTasks.length}
                </p>
              </div>
              <ProgressBar
                value={
                  developerAssignedTasks.length === 0
                    ? 0
                    : Math.round((userTaskSummary.completed / developerAssignedTasks.length) * 100)
                }
              />
            </div>
          </SectionCard>

          <SectionCard title="My Task Breakdown">
            <div className="space-y-4">
              {[
                { label: "To Do", value: myTodo.length, color: "bg-slate-400" },
                { label: "In Progress", value: myInProgress.length, color: "bg-indigo-500" },
                { label: "Completed", value: myCompleted.length, color: "bg-emerald-500" },
              ].map((item) => {
                const pct = developerAssignedTasks.length === 0 ? 0 : Math.round((item.value / developerAssignedTasks.length) * 100);
                return (
                  <div key={item.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{item.label}</span>
                      <span className="text-slate-500">{item.value}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </section>
      </div>
    );
  } catch (error) {
    console.error("Dashboard error:", error);

    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
            <svg className="h-6 w-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Unable to load dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">
            There was a problem loading your dashboard data. Please try again in a moment.
          </p>
        </div>
      </div>
    );
  }
}
