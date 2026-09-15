# Task Tracking System

A full-stack task tracking application for software development teams using Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, Drizzle ORM, NextAuth.js credentials authentication, bcryptjs, and Zod.

## Features

- Credentials registration, login, logout, JWT sessions, and protected routes
- ADMIN, MANAGER, and DEVELOPER authorization
- Project CRUD with progress and task statistics
- Task CRUD, assignment, status/priority updates, search, filtering, and sorting
- Persistent Kanban board status updates
- Admin-only user management with self-delete protection
- PostgreSQL-backed migrations and seed data

## Setup

```bash
npm install
```

Copy `.env.example` to `.env`, set `DATABASE_URL`, and provide a strong `AUTH_SECRET`.

Create the PostgreSQL database and run:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Database Commands

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Migrations are stored in `drizzle/` and preserve existing data.

## Seed Accounts

All seed accounts use `Password123!`:

| Role | Email |
| --- | --- |
| ADMIN | admin@example.com |
| MANAGER | manager@example.com |
| DEVELOPER | developer1@example.com |
| DEVELOPER | developer2@example.com |

Public registration always creates a `DEVELOPER`. Privileged accounts should be created through the admin user-management page.

## Production

```bash
npm run build
npm run start
```
