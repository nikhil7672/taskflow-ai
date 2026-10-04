import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';
import { app } from './app.js';
import { hashToken } from './auth/security.js';
import { parsePage } from './core/http.js';
import { projectCreateSchema } from './projects/schemas.js';
import { decideProjectAccess } from './projects/policy.js';
import { taskCreateSchema, taskUpdateSchema } from './tasks/schemas.js';
import { wouldCreateDependencyCycle } from './tasks/dependency-policy.js';

const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';

test('project creation schema rejects invalid identifiers, archived input status, and reversed dates', () => {
  assert.equal(projectCreateSchema.safeParse({ name: 'API', slug: 'api-project' }).success, true);
  assert.equal(projectCreateSchema.safeParse({ name: 'API', slug: 'Not valid' }).success, false);
  assert.equal(
    projectCreateSchema.safeParse({ name: 'API', slug: 'api', status: 'ARCHIVED' }).success,
    false,
  );
  assert.equal(
    projectCreateSchema.safeParse({
      name: 'API',
      slug: 'api',
      startDate: '2026-10-10',
      dueDate: '2026-10-01',
    }).success,
    false,
  );
});

test('task create and update schemas validate dates, title, and non-empty patches', () => {
  assert.equal(
    taskCreateSchema.safeParse({ title: 'Ship core API', dueAt: '2026-10-10T12:00:00Z' }).success,
    true,
  );
  assert.equal(taskCreateSchema.safeParse({ title: ' ', dueAt: 'not-a-date' }).success, false);
  assert.equal(taskUpdateSchema.safeParse({}).success, false);
  assert.equal(taskUpdateSchema.safeParse({ priority: 'URGENT' }).success, true);
});

test('project authorization scopes ordinary members and enforces write roles', () => {
  assert.equal(decideProjectAccess(null, null, 'read'), 'not_found');
  assert.equal(decideProjectAccess('MEMBER', null, 'read'), 'not_found');
  assert.equal(decideProjectAccess('MEMBER', 'VIEWER', 'read'), 'allow');
  assert.equal(decideProjectAccess('MEMBER', 'VIEWER', 'write'), 'forbidden');
  assert.equal(decideProjectAccess('MEMBER', 'MEMBER', 'write'), 'allow');
  assert.equal(decideProjectAccess('GUEST', 'ADMIN', 'admin'), 'allow');
  assert.equal(decideProjectAccess('ADMIN', null, 'admin'), 'allow');
});

test('dependency graph rejects self references and transitive cycles', () => {
  const edges = [
    { taskId: 'task-b', dependsOnId: 'task-a' },
    { taskId: 'task-c', dependsOnId: 'task-b' },
  ];
  assert.equal(wouldCreateDependencyCycle(edges, 'task-a', 'task-c'), true);
  assert.equal(wouldCreateDependencyCycle(edges, 'task-a', 'task-a'), true);
  assert.equal(wouldCreateDependencyCycle(edges, 'task-d', 'task-a'), false);
});

test('pagination rejects invalid page sizes', () => {
  assert.deepEqual(parsePage({ page: '2', pageSize: '30' }), {
    page: 2,
    pageSize: 30,
    skip: 30,
    take: 30,
  });
  assert.throws(() => parsePage({ page: 0 }));
  assert.throws(() => parsePage({ pageSize: 101 }));
});

test('project/task API routes require an authenticated session', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
  try {
    for (const route of [
      '/workspaces/workspace_123/projects',
      '/projects/project_123',
      '/projects/project_123/tasks',
      '/tasks/task_123/comments',
      '/tasks/task_123/dependencies',
      '/projects/project_123/activity',
    ]) {
      const response = await fetch(`${baseUrl}${route}`);
      assert.equal(response.status, 401, `${route} should require auth`);
    }
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test(
  'authenticated project and task workflow persists activity and returns paginated data',
  { skip: !process.env.DATABASE_URL },
  async () => {
    const { prisma } = await import('@taskflow/database');
    const token = randomBytes(32).toString('base64url');
    const suffix = randomBytes(6).toString('hex');
    const user = await prisma.user.create({
      data: { email: `api-${suffix}@example.test`, name: 'API Test User' },
    });
    const teammate = await prisma.user.create({
      data: { email: `teammate-${suffix}@example.test`, name: 'Workflow Teammate' },
    });
    const workspace = await prisma.workspace.create({
      data: { name: `API Test ${suffix}`, slug: `api-test-${suffix}`, createdById: user.id },
    });
    await prisma.workspaceMember.create({
      data: { workspaceId: workspace.id, userId: user.id, role: 'OWNER' },
    });
    await prisma.workspaceMember.create({
      data: { workspaceId: workspace.id, userId: teammate.id, role: 'MEMBER' },
    });
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
    const headers = {
      origin: webOrigin,
      cookie: `taskflow_session=${token}`,
      'content-type': 'application/json',
    };

    try {
      const projectResponse = await fetch(`${baseUrl}/workspaces/${workspace.id}/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Workflow project',
          slug: `workflow-${suffix}`,
          status: 'ACTIVE',
        }),
      });
      assert.equal(projectResponse.status, 201);
      const { project } = (await projectResponse.json()) as { project: { id: string } };

      const addedMemberResponse = await fetch(`${baseUrl}/projects/${project.id}/members`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: teammate.id, role: 'MEMBER' }),
      });
      assert.equal(addedMemberResponse.status, 201);
      const removedMemberResponse = await fetch(
        `${baseUrl}/projects/${project.id}/members/${teammate.id}`,
        { method: 'DELETE', headers },
      );
      assert.equal(removedMemberResponse.status, 204);

      const createdTaskResponse = await fetch(`${baseUrl}/projects/${project.id}/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: 'First task', priority: 'HIGH' }),
      });
      assert.equal(createdTaskResponse.status, 201);
      const { task } = (await createdTaskResponse.json()) as {
        task: { id: string; status: string };
      };
      assert.equal(task.status, 'TODO');

      const prerequisiteResponse = await fetch(`${baseUrl}/projects/${project.id}/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: 'Prerequisite task' }),
      });
      assert.equal(prerequisiteResponse.status, 201);
      const { task: prerequisite } = (await prerequisiteResponse.json()) as {
        task: { id: string };
      };

      const otherProjectResponse = await fetch(`${baseUrl}/workspaces/${workspace.id}/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: 'Other project', slug: `other-${suffix}` }),
      });
      assert.equal(otherProjectResponse.status, 201);
      const { project: otherProject } = (await otherProjectResponse.json()) as {
        project: { id: string };
      };
      const otherTaskResponse = await fetch(`${baseUrl}/projects/${otherProject.id}/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: 'Cross-project task' }),
      });
      const { task: otherTask } = (await otherTaskResponse.json()) as { task: { id: string } };

      const assignedResponse = await fetch(`${baseUrl}/tasks/${task.id}/assignee`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ assigneeId: user.id }),
      });
      assert.equal(assignedResponse.status, 200);

      const statusResponse = await fetch(`${baseUrl}/tasks/${task.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      assert.equal(statusResponse.status, 200);

      const commentResponse = await fetch(`${baseUrl}/tasks/${task.id}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: 'Starting work' }),
      });
      assert.equal(commentResponse.status, 201);

      const dependencyResponse = await fetch(`${baseUrl}/tasks/${task.id}/dependencies`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ dependsOnId: prerequisite.id }),
      });
      assert.equal(dependencyResponse.status, 201);
      const crossProjectDependencyResponse = await fetch(
        `${baseUrl}/tasks/${task.id}/dependencies`,
        { method: 'POST', headers, body: JSON.stringify({ dependsOnId: otherTask.id }) },
      );
      assert.equal(crossProjectDependencyResponse.status, 400);
      const cycleResponse = await fetch(`${baseUrl}/tasks/${prerequisite.id}/dependencies`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ dependsOnId: task.id }),
      });
      assert.equal(cycleResponse.status, 409);
      const dependenciesResponse = await fetch(`${baseUrl}/tasks/${task.id}/dependencies`, {
        headers,
      });
      const dependencies = (await dependenciesResponse.json()) as { items: unknown[] };
      assert.equal(dependencies.items.length, 1);
      const removedDependencyResponse = await fetch(
        `${baseUrl}/tasks/${task.id}/dependencies/${prerequisite.id}`,
        { method: 'DELETE', headers },
      );
      assert.equal(removedDependencyResponse.status, 204);

      const projectActivityResponse = await fetch(`${baseUrl}/projects/${project.id}/activity`, {
        headers,
      });
      assert.equal(projectActivityResponse.status, 200);
      const projectActivity = (await projectActivityResponse.json()) as { items: unknown[] };
      assert.ok(projectActivity.items.length > 0);

      const listResponse = await fetch(
        `${baseUrl}/projects/${project.id}/tasks?status=IN_PROGRESS&page=1&pageSize=10`,
        { headers },
      );
      assert.equal(listResponse.status, 200);
      const result = (await listResponse.json()) as {
        items: Array<{ id: string }>;
        pagination: { total: number };
      };
      assert.equal(result.pagination.total, 1);
      assert.equal(result.items[0]?.id, task.id);

      const activityCount = await prisma.activityLog.count({
        where: { workspaceId: workspace.id },
      });
      assert.ok(activityCount >= 6);
    } finally {
      server.close();
      await once(server, 'close');
      await prisma.workspace.delete({ where: { id: workspace.id } });
      await prisma.user.delete({ where: { id: user.id } });
      await prisma.user.delete({ where: { id: teammate.id } });
    }
  },
);
