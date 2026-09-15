import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import AppShell from "@/components/layout/AppShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskFlow — Task Tracking System",
  description: "Professional project and task tracking for modern teams.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const userName = session?.user?.name ?? undefined;

  const items =
    role === "ADMIN"
      ? [
          { label: "Dashboard", value: "dashboard" },
          { label: "Projects", value: "projects" },
          { label: "Tasks", value: "tasks" },
          { label: "Kanban Board", value: "kanban" },
          { label: "Users", value: "users" },
          { label: "Profile", value: "profile" },
          { label: "Logout", value: "logout" },
        ]
      : role === "MANAGER"
        ? [
            { label: "Dashboard", value: "dashboard" },
            { label: "Projects", value: "projects" },
            { label: "Tasks", value: "tasks" },
            { label: "Kanban Board", value: "kanban" },
            { label: "Profile", value: "profile" },
            { label: "Logout", value: "logout" },
          ]
        : [
            { label: "Dashboard", value: "dashboard" },
            { label: "My Tasks", value: "my-tasks" },
            { label: "Kanban Board", value: "kanban" },
            { label: "Profile", value: "profile" },
            { label: "Logout", value: "logout" },
          ];

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppShell
          items={items}
          authenticated={Boolean(session?.user)}
          userName={userName}
          userRole={role ?? undefined}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
