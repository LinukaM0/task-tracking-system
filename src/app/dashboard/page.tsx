import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";

import { authOptions } from "@/auth";
import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import {
  PriorityBadge,
  ProgressBar,
  SectionCard,
  Sidebar,
  StatCard,
  StatusBadge,
} from "@/components/dashboard/DashboardLayout";

const ADMIN_SIDEBAR = [
  { label: "Dashboard", value: "dashboard", active: true },
  { label: "Projects", value: "projects" },
  { label: "Tasks", value: "tasks" },
  { label: "Kanban Board", value: "kanban" },
  { label: "Users", value: "users" },
  { label: "Profile", value: "profile" },
  { label: "Logout", value: "logout" },
];

const MANAGER_SIDEBAR = [
  { label: "Dashboard", value: "dashboard", active: true },
  { label: "Projects", value: "projects" },
  { label: "Tasks", value: "tasks" },
  { label: "Kanban Board", value: "kanban" },
  { label: "Profile", value: "profile" },
  { label: "Logout", value: "logout" },
];

const DEVELOPER_SIDEBAR = [
  { label: "Dashboard", value: "dashboard", active: true },
  { label: "My Tasks", value: "my-tasks" },
  { label: "Kanban Board", value: "kanban" },
  { label: "Profile", value: "profile" },
  { label: "Logout", value: "logout" },
];

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

    const recentProjects = [...allProjects]
      .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
      .slice(0, 5);

    const recentTasks = [...allTasks]
      .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
      .slice(0, 5);

    const todoTasks = allTasks.filter((task) => task.status === "TODO").length;
    const inProgressTasks = allTasks.filter((task) => task.status === "IN_PROGRESS").length;
    const completedTasks = allTasks.filter((task) => task.status === "COMPLETED").length;
    const overdueTasks = allTasks.filter((task) => {
      if (!task.dueDate || task.status === "COMPLETED") return false;
      return new Date(task.dueDate).getTime() < Date.now();
    }).length;

    const projectProgress = allProjects.map((project) => {
      const projectTasks = allTasks.filter((task) => Number(task.projectId) === project.id);
      const completed = projectTasks.filter((task) => task.status === "COMPLETED").length;
      const percentage = projectTasks.length === 0 ? 0 : Math.round((completed / projectTasks.length) * 100);

      return {
        id: project.id,
        name: project.name,
        percentage,
        totalTasks: projectTasks.length,
      };
    });

    const overallProgress =
      allTasks.length === 0 ? 0 : Math.round((completedTasks / allTasks.length) * 100);

    const developerProgress = allUsers
      .filter((user) => user.role === "DEVELOPER")
      .map((user) => {
        const userTasks = allTasks.filter(
          (task) => task.assignedTo !== null && Number(task.assignedTo) === user.id
        );
        const completed = userTasks.filter((task) => task.status === "COMPLETED").length;

        return {
          id: user.id,
          name: user.name,
          totalTasks: userTasks.length,
          progress: userTasks.length === 0 ? 0 : Math.round((completed / userTasks.length) * 100),
        };
      });

    const upcomingDeadlines = allTasks
      .filter((task) => task.dueDate && task.status !== "COMPLETED")
      .sort(
        (a, b) =>
          new Date(a.dueDate as Date).getTime() - new Date(b.dueDate as Date).getTime()
      )
      .slice(0, 5);

    const developerAssignedTasks = allTasks.filter(
      (task) => task.assignedTo !== null && Number(task.assignedTo) === currentUserId
    );

    const myTodo = developerAssignedTasks.filter((task) => task.status === "TODO");
    const myInProgress = developerAssignedTasks.filter((task) => task.status === "IN_PROGRESS");
    const myCompleted = developerAssignedTasks.filter((task) => task.status === "COMPLETED");
    const myOverdue = developerAssignedTasks.filter((task) => {
      if (!task.dueDate || task.status === "COMPLETED") return false;
      return new Date(task.dueDate).getTime() < Date.now();
    });

    const userTaskSummary = {
      total: developerAssignedTasks.length,
      todo: myTodo.length,
      inProgress: myInProgress.length,
      completed: myCompleted.length,
      overdue: myOverdue.length,
    };

    const sidebarItems =
      role === "ADMIN"
        ? ADMIN_SIDEBAR
        : role === "MANAGER"
          ? MANAGER_SIDEBAR
          : DEVELOPER_SIDEBAR;

    if (role === "ADMIN") {
      return (
        <main className="min-h-screen bg-slate-100 p-4 text-slate-900 lg:p-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
            <Sidebar items={sidebarItems} />

            <div className="flex-1 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Admin Dashboard
                </p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">
                  Welcome, {currentUser.name}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  System overview for your team and project portfolio.
                </p>
              </div>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard label="Total Users" value={allUsers.length} tone="bg-violet-50 text-violet-700" />
                <StatCard label="Total Projects" value={allProjects.length} tone="bg-blue-50 text-blue-700" />
                <StatCard label="Total Tasks" value={allTasks.length} tone="bg-sky-50 text-sky-700" />
                <StatCard label="TODO" value={todoTasks} tone="bg-slate-50 text-slate-700" />
                <StatCard label="In Progress" value={inProgressTasks} tone="bg-cyan-50 text-cyan-700" />
                <StatCard label="Completed" value={completedTasks} tone="bg-emerald-50 text-emerald-700" />
                <StatCard label="Overdue" value={overdueTasks} tone="bg-rose-50 text-rose-700" />
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <SectionCard title="Recent Projects" subtitle={`${recentProjects.length} items`}>
                  {recentProjects.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                      No projects yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentProjects.map((project) => (
                        <div key={project.id} className="rounded-xl border border-slate-200 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-slate-900">{project.name}</p>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">
                              {project.status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            {project.description || "No description provided"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Recent Tasks" subtitle={`${recentTasks.length} items`}>
                  {recentTasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                      No tasks created yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentTasks.map((task) => (
                        <div key={task.id} className="rounded-xl border border-slate-200 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-slate-900">{task.title}</p>
                            <StatusBadge status={task.status} />
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                            <span>Project #{task.projectId}</span>
                            <PriorityBadge priority={task.priority} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <SectionCard title="Overall Project Progress">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">Portfolio completion</span>
                      <span className="text-slate-500">{overallProgress}%</span>
                    </div>
                    <ProgressBar value={overallProgress} color="bg-gradient-to-r from-blue-500 to-emerald-500" />
                  </div>
                </SectionCard>

                <SectionCard title="Overall Task Status Summary">
                  <div className="space-y-4">
                    {[
                      { label: "TODO", value: todoTasks, color: "bg-slate-500" },
                      { label: "IN PROGRESS", value: inProgressTasks, color: "bg-blue-500" },
                      { label: "COMPLETED", value: completedTasks, color: "bg-emerald-500" },
                    ].map((item) => {
                      const pct = allTasks.length === 0 ? 0 : Math.round((item.value / allTasks.length) * 100);
                      return (
                        <div key={item.label}>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">{item.label}</span>
                            <span className="text-slate-500">{item.value}</span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>
              </section>

              <SectionCard title="Team / User Overview">
                {allUsers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    No users available.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {allUsers.map((user) => {
                      const userTasks = allTasks.filter(
                        (task) => task.assignedTo !== null && Number(task.assignedTo) === user.id
                      );
                      const completed = userTasks.filter((task) => task.status === "COMPLETED").length;
                      const percentage = userTasks.length === 0 ? 0 : Math.round((completed / userTasks.length) * 100);

                      return (
                        <div key={user.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold text-blue-700">
                              {user.role}
                            </span>
                          </div>
                          <div className="mt-4">
                            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                              <span>{userTasks.length} tasks</span>
                              <span>{percentage}% done</span>
                            </div>
                            <ProgressBar value={percentage} color="bg-gradient-to-r from-blue-500 to-emerald-500" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        </main>
      );
    }

    if (role === "MANAGER") {
      return (
        <main className="min-h-screen bg-slate-100 p-4 text-slate-900 lg:p-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
            <Sidebar items={sidebarItems} />

            <div className="flex-1 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Manager Dashboard
                </p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">
                  Welcome, {currentUser.name}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Track delivery progress across projects and your team.
                </p>
              </div>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard label="Total Projects" value={allProjects.length} tone="bg-blue-50 text-blue-700" />
                <StatCard label="Total Tasks" value={allTasks.length} tone="bg-violet-50 text-violet-700" />
                <StatCard label="TODO" value={todoTasks} tone="bg-slate-50 text-slate-700" />
                <StatCard label="In Progress" value={inProgressTasks} tone="bg-cyan-50 text-cyan-700" />
                <StatCard label="Completed" value={completedTasks} tone="bg-emerald-50 text-emerald-700" />
                <StatCard label="Overdue" value={overdueTasks} tone="bg-rose-50 text-rose-700" />
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <SectionCard title="Project Progress">
                  {allProjects.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                      No projects available for your team.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projectProgress.map((project) => (
                        <div key={project.id}>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">{project.name}</span>
                            <span className="text-slate-500">{project.percentage}%</span>
                          </div>
                          <ProgressBar value={project.percentage} color="bg-gradient-to-r from-blue-500 to-emerald-500" />
                          <p className="mt-2 text-xs text-slate-500">{project.totalTasks} tasks</p>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Developer / Team Task Progress">
                  {developerProgress.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                      No developers in the team yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {developerProgress.map((person) => (
                        <div key={person.id}>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">{person.name}</span>
                            <span className="text-slate-500">{person.progress}%</span>
                          </div>
                          <ProgressBar value={person.progress} color="bg-gradient-to-r from-indigo-500 to-blue-500" />
                          <p className="mt-2 text-xs text-slate-500">{person.totalTasks} assigned tasks</p>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <SectionCard title="Tasks Assigned to Developers" subtitle={`${allTasks.filter((task) => task.assignedTo !== null).length} items`}>
                  {allTasks.filter((task) => task.assignedTo !== null).length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                      No assigned tasks yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allTasks.filter((task) => task.assignedTo !== null).slice(0, 6).map((task) => (
                        <div key={task.id} className="rounded-xl border border-slate-200 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-slate-900">{task.title}</p>
                            <StatusBadge status={task.status} />
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                            <span>Assigned to #{task.assignedTo}</span>
                            <PriorityBadge priority={task.priority} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Upcoming Deadlines" subtitle={`${upcomingDeadlines.length} items`}>
                  {upcomingDeadlines.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                      No upcoming deadlines.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingDeadlines.map((task) => (
                        <div key={task.id} className="rounded-xl border border-slate-200 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-slate-900">{task.title}</p>
                            <StatusBadge status={task.status} />
                          </div>
                          <p className="mt-2 text-xs text-slate-500">Due: {formatDate(task.dueDate)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </section>

              <SectionCard title="Recently Created Tasks" subtitle={`${recentTasks.length} items`}>
                {recentTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    No tasks created yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTasks.map((task) => (
                      <div key={task.id} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-slate-900">{task.title}</p>
                          <StatusBadge status={task.status} />
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span>Project #{task.projectId}</span>
                          <span>{formatDate(task.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-slate-100 p-4 text-slate-900 lg:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
          <Sidebar items={sidebarItems} />

          <div className="flex-1 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                Developer Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Welcome, {currentUser.name}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Your personal task and delivery overview.
              </p>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard label="My Assigned Tasks" value={userTaskSummary.total} tone="bg-blue-50 text-blue-700" />
              <StatCard label="My TODO" value={userTaskSummary.todo} tone="bg-slate-50 text-slate-700" />
              <StatCard label="My In Progress" value={userTaskSummary.inProgress} tone="bg-cyan-50 text-cyan-700" />
              <StatCard label="My Completed" value={userTaskSummary.completed} tone="bg-emerald-50 text-emerald-700" />
              <StatCard label="My Overdue" value={userTaskSummary.overdue} tone="bg-rose-50 text-rose-700" />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <SectionCard title="My Recent Tasks" subtitle={`${developerAssignedTasks.length} items`}>
                {developerAssignedTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    No tasks assigned to you.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {developerAssignedTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-slate-900">{task.title}</p>
                          <StatusBadge status={task.status} />
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span>{formatDate(task.dueDate)}</span>
                          <PriorityBadge priority={task.priority} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Upcoming Deadlines" subtitle={`${developerAssignedTasks.filter((task) => task.dueDate && task.status !== "COMPLETED").length} items`}>
                {developerAssignedTasks.filter((task) => task.dueDate && task.status !== "COMPLETED").length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    No active deadlines.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {developerAssignedTasks
                      .filter((task) => task.dueDate && task.status !== "COMPLETED")
                      .sort((a, b) => new Date(a.dueDate as Date).getTime() - new Date(b.dueDate as Date).getTime())
                      .slice(0, 5)
                      .map((task) => (
                        <div key={task.id} className="rounded-xl border border-slate-200 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-slate-900">{task.title}</p>
                            <StatusBadge status={task.status} />
                          </div>
                          <p className="mt-2 text-xs text-slate-500">Due: {formatDate(task.dueDate)}</p>
                        </div>
                      ))}
                  </div>
                )}
              </SectionCard>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <SectionCard title="My Task Progress">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">Completion rate</span>
                    <span className="text-slate-500">
                      {developerAssignedTasks.length === 0
                        ? 0
                        : Math.round((userTaskSummary.completed / developerAssignedTasks.length) * 100)}%
                    </span>
                  </div>
                  <ProgressBar
                    value={
                      developerAssignedTasks.length === 0
                        ? 0
                        : Math.round((userTaskSummary.completed / developerAssignedTasks.length) * 100)
                    }
                    color="bg-gradient-to-r from-blue-500 to-emerald-500"
                  />
                </div>
              </SectionCard>

              <SectionCard title="My Task Status Summary">
                <div className="space-y-4">
                  {[
                    { label: "TODO", value: myTodo.length, color: "bg-slate-500" },
                    { label: "IN PROGRESS", value: myInProgress.length, color: "bg-blue-500" },
                    { label: "COMPLETED", value: myCompleted.length, color: "bg-emerald-500" },
                  ].map((item) => {
                    const pct = developerAssignedTasks.length === 0 ? 0 : Math.round((item.value / developerAssignedTasks.length) * 100);
                    return (
                      <div key={item.label}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">{item.label}</span>
                          <span className="text-slate-500">{item.value}</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </section>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Dashboard error:", error);

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
        <div className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
            Error
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Unable to load dashboard
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            There was a problem loading your dashboard data. Please try again in a moment.
          </p>
        </div>
      </main>
    );
  }
}
