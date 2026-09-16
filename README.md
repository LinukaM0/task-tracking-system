# Task Tracking System

A full-stack Task Tracking System designed for software development teams to manage projects, tasks, assignments, progress, and team members.

Built with Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, Drizzle ORM, NextAuth.js, bcryptjs, and Zod.

## Features

- User registration and login
- Credentials-based authentication with NextAuth.js
- JWT sessions
- Protected routes
- Role-based authorization
- ADMIN, MANAGER, and DEVELOPER roles
- Project management
- Project progress tracking
- Task management
- Task assignment
- Task status and priority management
- Task search, filtering, and sorting
- Persistent Kanban board
- Admin user management
- User profile management
- Dashboard with project and task statistics
- Responsive UI
- PostgreSQL database with Drizzle ORM
- Database migrations and seed data
- Input validation with Zod
- Password hashing with bcryptjs

## Tech Stack

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- PostgreSQL 18
- Drizzle ORM
- Drizzle Kit
- NextAuth.js / Auth.js
- Zod
- bcryptjs
- Turbopack

## User Roles

### ADMIN

- Manage users
- Create, edit, and delete projects
- Create, edit, and delete tasks
- Assign tasks
- View all projects and tasks
- View project and task progress

### MANAGER

- Create and edit projects
- Create, edit, and delete tasks
- Assign tasks to developers
- View project and task progress

### DEVELOPER

- View assigned tasks
- View task details
- Update assigned task status
- Cannot manage users
- Cannot delete projects
- Cannot assign tasks

## Database

The application uses PostgreSQL with Drizzle ORM.

Main tables:

- Users
- Projects
- Tasks

Projects are related to users through the project creator. Tasks are related to projects and users through project, assigned user, and task creator relationships.

## Environment Variables

Create a `.env` file in the project root and configure:

DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/task_tracking_db

AUTH_SECRET=your_strong_secret_here

Do not commit `.env` or real credentials to GitHub.

## Installation

Install dependencies:

npm install

Create a PostgreSQL database named:

task_tracking_db

Configure the required environment variables in `.env`.

## Database Setup

Generate migrations:

npm run db:generate

Run migrations:

npm run db:migrate

Seed the database:

npm run db:seed

## Development

Start the development server:

npm run dev

Open http://localhost:3000

## Database Commands

npm run db:generate
npm run db:migrate
npm run db:seed

Migrations are stored in the `drizzle/` directory.

## Seed Accounts

The seed script creates sample accounts for development and testing.

All seed accounts use the password:

Password123!

| Role | Email |
| --- | --- |
| ADMIN | admin@gmail.com |
| MANAGER | manager@gmail.com |
| DEVELOPER | developer1@gmail.com |
| DEVELOPER | developer2@gmail.com |

These accounts are intended for local development and testing only. Do not use the default seed credentials in a production environment.

Public registration creates users with the DEVELOPER role by default.

## Task Statuses

- TODO
- IN_PROGRESS
- COMPLETED

## Task Priorities

- LOW
- MEDIUM
- HIGH
- URGENT

## Project Statuses

- PLANNED
- IN_PROGRESS
- COMPLETED

## Authentication & Security

The application uses NextAuth.js credentials authentication, JWT-based sessions, bcryptjs password hashing, Zod validation, protected routes, and role-based authorization.

Server-side permission checks are used to protect sensitive operations such as user management, project management, task management, and task assignment.

Passwords are securely hashed and are never stored in plain text.

## Production

Create a production build:

npm run build

Start the production server:

npm run start

Before deploying to production:

- Use a production PostgreSQL database
- Set a strong AUTH_SECRET
- Use secure environment variables
- Do not use default seed passwords
- Do not commit `.env` files
- Review authentication and authorization settings
- Run database migrations

## Development Workflow

Typical development workflow:

npm install
npm run db:migrate
npm run db:seed
npm run dev

For production:

npm run build
npm run start

