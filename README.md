# TaskFlow AI

TaskFlow AI is a TypeScript monorepo for an AI-powered project management SaaS. This repository currently contains the development foundation: a Next.js frontend, an Express API, shared Zod contracts, and a Prisma/PostgreSQL package.

## Requirements

- Node.js 22.9 or newer (Node.js 22 LTS recommended)
- pnpm 11.19.0 (the version pinned in `package.json`)
- PostgreSQL 14 or newer

## Getting started

1. Install dependencies:

   ```bash
   pnpm install
   ```

   pnpm may request approval for dependency lifecycle scripts. Approve only the named packages required by the workspace, including Prisma engines and esbuild.

2. Create a local environment file from the example:

   ```bash
   cp .env.example .env
   ```

   On PowerShell, use `Copy-Item .env.example .env`. Set `DATABASE_URL` to a PostgreSQL database you can access. The example URL is a local development placeholder, not a production credential.

3. Generate the Prisma client and apply the checked-in initial migration:

   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

   `pnpm db:migrate` applies the migration to the configured development database and regenerates the client. Create the PostgreSQL database itself first if it does not exist. For an existing shared/staging/production database, apply reviewed migrations with:

   ```bash
   pnpm db:migrate:deploy
   ```

   The root `.env` is loaded for Prisma commands as well as the API. For production, supply `DATABASE_URL` through the deployment environment rather than a checked-in file.

4. Start the applications in separate terminals from the repository root:

   ```bash
   pnpm dev:web
   pnpm dev:api
   ```

   The frontend is at [http://localhost:3000](http://localhost:3000). The API health endpoint is [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health).

## Common commands

| Command                  | Purpose                                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| `pnpm dev:web`           | Start Next.js in development mode                                       |
| `pnpm dev:api`           | Start Express with automatic TypeScript reload                          |
| `pnpm build:api`         | Build the database client package and Express API                       |
| `pnpm test:api`          | Run API unit, route, validation, and optional PostgreSQL workflow tests |
| `pnpm build:web`         | Build the frontend for production                                       |
| `pnpm typecheck`         | Type-check all workspace packages                                       |
| `pnpm lint`              | Lint all workspace packages                                             |
| `pnpm format`            | Format tracked and unignored files with Prettier                        |
| `pnpm format:check`      | Check formatting without modifying files                                |
| `pnpm db:generate`       | Generate the Prisma client                                              |
| `pnpm db:migrate`        | Create/apply local development migrations                               |
| `pnpm db:migrate:deploy` | Apply checked-in migrations in shared environments                      |
| `pnpm db:migrate:status` | Show whether migrations have been applied                               |
| `pnpm db:push`           | Prototype-only schema sync; does not create migrations                  |
| `pnpm db:studio`         | Open Prisma Studio                                                      |

## Workspace layout

```text
apps/
  api/             Express REST API, authentication, authorization, and tests
  web/             Next.js App Router frontend
packages/
  contracts/       Shared Zod schemas and TypeScript types
  database/        Prisma schema, migrations, and shared database client
```

## Environment variables

Copy `.env.example` to `.env` in the repository root. The root environment file is used by the API and Prisma CLI. Do not commit `.env` or place secrets in `NEXT_PUBLIC_*` variables; Next.js exposes those values to the browser. The current `NEXT_PUBLIC_API_BASE_URL` is only a public API origin.

## UI components

The frontend uses Tailwind CSS and is configured for shadcn/ui. Add a component from the repository root with the local CLI, for example `pnpm --filter @taskflow/web run ui add button`.

## Development notes

- `apps/web` and `apps/api` are independently runnable workspace applications.
- API CORS allows the configured `WEB_ORIGIN` (defaults to the local frontend origin).
- The health endpoint is a process liveness check; it does not verify database readiness.
- Authentication and core project/task/team screens use the PostgreSQL-backed API. Notifications and the AI assistant remain demo-only until corresponding backend modules are available.
- The browser API client uses `NEXT_PUBLIC_API_BASE_URL` and sends the HttpOnly session cookie with requests. Next.js server-rendered workspace pages use `API_INTERNAL_BASE_URL` and forward only the session cookie to Express. The session token is never stored in browser JavaScript storage.
- Project and task forms use native browser input validation and send JSON through the shared API client. Express validates every request with Zod and performs authorization against the authenticated database session.

## Database design

`packages/database/prisma/schema.prisma` defines users and provider accounts/sessions; workspace and project membership join tables; projects and hierarchical tasks; comments, file metadata attachments, task dependencies, notifications, activity history, invitations, and a transactional outbox for real-time delivery. Membership tables keep roles and membership timestamps on the relationship. Compound unique constraints prevent duplicate memberships; indexes cover workspace/project lists, board columns and ordering, assignee queues, deadlines, unread notifications, activity timelines, and unpublished outbox events.

Workspace deletion cascades through its projects and collaboration records. Project deletion cascades through tasks and task content. Deleting a user removes their login and membership records while preserving authored content/history with nullable author references where appropriate. Session, password-reset, and invitation tokens are stored as hashes; OAuth credentials must be encrypted by the application before persistence. Email addresses are stored lowercase, and task/invitation invariants are enforced by checks in the initial SQL migration.

Multi-record operations use Prisma transactions for project creation with its first administrator membership and activity record, and for task changes with activity records. Invitation acceptance and outbox delivery remain future work; a worker can publish outbox rows to Socket.IO and retry failed delivery. Parent tasks and assignees are checked against the current project/workspace before writes.

## Authentication

The Express API owns credential verification and opaque database sessions. Registration validates and normalizes input, hashes passwords with Node.js `scrypt`, then creates the user, owner membership, initial workspace, and session in one transaction. The browser receives only a random session token in an `HttpOnly`, `SameSite=Lax` cookie; PostgreSQL stores its SHA-256 hash and expiration. The Next.js workspace layout calls the protected `/auth/me` endpoint before rendering, while every API route verifies the session independently.

`POST /api/v1/auth/login`, `/register`, and `/logout` manage sessions; `/auth/me` reads and updates the current profile; `/auth/sessions` lists the current user’s active sessions and allows revocation. Workspace reads require membership, and workspace renames require an `OWNER` or `ADMIN` role fetched from PostgreSQL. Request bodies cannot supply effective roles. Password reset uses short-lived, one-use hashed tokens, generic responses to prevent account discovery, and revokes all sessions after a successful reset.

Configure `EMAIL_DELIVERY_URL`, `EMAIL_DELIVERY_TOKEN`, and `EMAIL_FROM` to enable password-reset email delivery. The delivery service accepts a JSON POST with `from`, `to`, `subject`, and `text` fields. These settings are server-only. Keep `SESSION_COOKIE_DOMAIN` empty for local development; set it only when the frontend and API use related production hosts. Set `TRUST_PROXY=true` only behind a trusted reverse proxy. The current rate limiter is process-local; use a shared store before running multiple API instances.

`pnpm test:api` builds the database package and API, then runs Node’s built-in test runner against password hashing, input validation, session-token handling, cookie policy, rate limits, CSRF origin checks, authorization policy, pagination, and unauthenticated route guards. A PostgreSQL-backed project/task workflow test runs when `DATABASE_URL` is configured and the schema is migrated; otherwise it is skipped.

## Core REST API

All routes are prefixed with `/api/v1`. Protected requests use the `taskflow_session` HttpOnly cookie. Browser writes must include the configured `Origin`; send JSON with `Content-Type: application/json`. The API returns `{ "error": { "code": "...", "message": "..." } }` for errors. Lists return `{ "items": [...], "pagination": { "page": 1, "pageSize": 20, "total": 0, "pages": 0 } }`. `page` defaults to 1 and `pageSize` to 20 (maximum 100).

### User and workspace routes

| Method         | Endpoint                                   | Access                                                                                |
| -------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| `GET`, `PATCH` | `/auth/me`                                 | Current user; profile updates only                                                    |
| `GET`          | `/workspaces/:workspaceId`                 | Workspace member                                                                      |
| `PATCH`        | `/workspaces/:workspaceId`                 | Workspace `OWNER` or `ADMIN`                                                          |
| `GET`          | `/workspaces/:workspaceId/members`         | Workspace member                                                                      |
| `GET`          | `/workspaces/:workspaceId/overview`        | Workspace member; returns visible projects, task counts, upcoming tasks, and activity |
| `PATCH`        | `/workspaces/:workspaceId/members/:userId` | `OWNER` or `ADMIN`; only owner can grant/change admin                                 |
| `DELETE`       | `/workspaces/:workspaceId/members/:userId` | `OWNER` or `ADMIN`; owner removal requires ownership transfer first                   |
| `GET`          | `/workspaces/:workspaceId/activity`        | Workspace member, filtered to visible projects                                        |

Workspace member role updates accept `{ "role": "ADMIN" | "MEMBER" | "GUEST" }`. New workspace membership is invitation-based; direct member creation is intentionally not exposed.

### Project routes

| Method            | Endpoint                               | Access                                                               |
| ----------------- | -------------------------------------- | -------------------------------------------------------------------- |
| `GET`, `POST`     | `/workspaces/:workspaceId/projects`    | Workspace member to read; non-guest to create                        |
| `GET`             | `/projects/:projectId`                 | Workspace admin or project member                                    |
| `PATCH`, `DELETE` | `/projects/:projectId`                 | Project admin or workspace admin                                     |
| `POST`            | `/projects/:projectId/archive`         | Project admin or workspace admin                                     |
| `GET`, `POST`     | `/projects/:projectId/members`         | Read follows project access; changes require project/workspace admin |
| `DELETE`          | `/projects/:projectId/members/:userId` | Project admin or workspace admin                                     |

Create a project with:

```http
POST /api/v1/workspaces/ws_123/projects
Content-Type: application/json

{
  "name": "Website refresh",
  "slug": "website-refresh",
  "description": "Plan and ship the new marketing site",
  "status": "ACTIVE",
  "dueDate": "2026-11-15"
}
```

Success returns `201 Created` with `{ "project": { "id": "...", "name": "Website refresh", "status": "ACTIVE", ... } }`. Project create automatically adds its creator as a project administrator. Add a project member with `{ "userId": "usr_...", "role": "MEMBER" }`; the user must already belong to the same workspace.

### Task and comment routes

| Method                   | Endpoint                     | Access                                                                          |
| ------------------------ | ---------------------------- | ------------------------------------------------------------------------------- |
| `GET`, `POST`            | `/projects/:projectId/tasks` | Project read access; writes require project `ADMIN`/`MEMBER` or workspace admin |
| `GET`, `PATCH`, `DELETE` | `/tasks/:taskId`             | Read/edit follows project role; delete requires project/workspace admin         |
| `PATCH`                  | `/tasks/:taskId/status`      | Task writer                                                                     |
| `PUT`                    | `/tasks/:taskId/assignee`    | Task writer; assignee must be a workspace member; null unassigns                |
| `GET`, `POST`            | `/tasks/:taskId/comments`    | Project reader to list; task writer to comment                                  |

Task lists support `page`, `pageSize`, `status`, `priority`, `assigneeId` (use `unassigned` for none), `search`, `dueBefore`, and `dueAfter`. Create a task with `POST /api/v1/projects/prj_123/tasks` and `{ "title": "Review homepage", "priority": "HIGH", "dueAt": "2026-10-20T17:00:00Z" }`. Success returns `201 Created` with `{ "task": { "id": "...", "status": "TODO", ... } }`. Change status with `PATCH /api/v1/tasks/task_123/status` and `{ "status": "IN_PROGRESS" }`; add a comment with `POST /api/v1/tasks/task_123/comments` and `{ "content": "Ready for review" }`.

The dashboard reads `GET /api/v1/workspaces/:workspaceId/overview` for project progress, task status totals, upcoming deadlines, member count, and recent activity. Project lists and statistics are workspace-scoped and limited to projects visible to the current user.

Workspace `OWNER`/`ADMIN` roles can read and manage every project. Other workspace members and guests only see projects where they have project membership. Project `VIEWER` is read-only, `MEMBER` can create and update tasks/comments, and project `ADMIN` can also manage project settings and members. Resource access outside the caller’s workspace is returned as `404` to avoid disclosing existence. Mutations record actor, action, and relevant resource in `ActivityLog` within the same database transaction where applicable.
