import { prisma } from '@taskflow/database';
import type { Prisma } from '@taskflow/database';
import { HttpError } from '../core/http.js';

export const projectSelect = {
  id: true,
  workspaceId: true,
  createdById: true,
  name: true,
  slug: true,
  description: true,
  status: true,
  color: true,
  startDate: true,
  dueDate: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

export const projectRepository = {
  workspaceRole(workspaceId: string, userId: string) {
    return prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    });
  },
  projectRole(projectId: string, userId: string) {
    return prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true },
    });
  },
  countProjectAdmins(projectId: string) {
    return prisma.projectMember.count({ where: { projectId, role: 'ADMIN' } });
  },
  async getProject(projectId: string) {
    return prisma.project.findUnique({
      where: { id: projectId },
      select: { ...projectSelect, workspaceId: true },
    });
  },
  async list(
    workspaceId: string,
    userId: string,
    elevated: boolean,
    skip: number,
    take: number,
    search?: string,
  ) {
    const where: Prisma.ProjectWhereInput = {
      workspaceId,
      ...(elevated ? {} : { members: { some: { userId } } }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        select: projectSelect,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      prisma.project.count({ where }),
    ]);
    return { items, total };
  },
  create(data: Prisma.ProjectUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      const project = await tx.project.create({ data, select: projectSelect });
      await tx.projectMember.upsert({
        where: { projectId_userId: { projectId: project.id, userId: data.createdById! } },
        create: { projectId: project.id, userId: data.createdById!, role: 'ADMIN' },
        update: {},
      });
      await tx.activityLog.create({
        data: {
          workspaceId: project.workspaceId,
          actorId: data.createdById ?? null,
          projectId: project.id,
          action: 'project.created',
        },
      });
      return project;
    });
  },
  update(projectId: string, data: Prisma.ProjectUpdateInput, actorId: string, action: string) {
    return prisma.$transaction(async (tx) => {
      const project = await tx.project.update({
        where: { id: projectId },
        data,
        select: projectSelect,
      });
      await tx.activityLog.create({
        data: { workspaceId: project.workspaceId, actorId, projectId, action },
      });
      return project;
    });
  },
  async delete(projectId: string, actorId: string) {
    await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({
        where: { id: projectId },
        select: { workspaceId: true, name: true },
      });
      await tx.activityLog.create({
        data: {
          workspaceId: project.workspaceId,
          actorId,
          action: 'project.deleted',
          metadata: { projectId, name: project.name },
        },
      });
      await tx.project.delete({ where: { id: projectId } });
    });
  },
  async memberIsWorkspaceMember(workspaceId: string, userId: string) {
    return Boolean(
      await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } },
        select: { id: true },
      }),
    );
  },
  addMember(
    projectId: string,
    userId: string,
    role: 'ADMIN' | 'MEMBER' | 'VIEWER',
    actorId: string,
  ) {
    return prisma.$transaction(
      async (tx) => {
        const project = await tx.project.findUniqueOrThrow({
          where: { id: projectId },
          select: { workspaceId: true },
        });
        const workspaceMember = await tx.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId: project.workspaceId, userId } },
          select: { id: true },
        });
        if (!workspaceMember)
          throw new HttpError(400, 'INVALID_MEMBER', 'User must belong to this workspace');
        const existing = await tx.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId } },
          select: { role: true },
        });
        if (existing?.role === 'ADMIN' && role !== 'ADMIN') {
          const admins = await tx.projectMember.count({ where: { projectId, role: 'ADMIN' } });
          if (admins <= 1)
            throw new HttpError(
              409,
              'LAST_PROJECT_ADMIN',
              'A project must retain at least one administrator',
            );
        }
        const member = await tx.projectMember.upsert({
          where: { projectId_userId: { projectId, userId } },
          create: { projectId, userId, role },
          update: { role },
          select: { projectId: true, userId: true, role: true, addedAt: true },
        });
        await tx.activityLog.create({
          data: {
            workspaceId: project.workspaceId,
            projectId,
            actorId,
            action: 'project.member_added',
            metadata: { userId, role },
          },
        });
        return member;
      },
      { isolationLevel: 'Serializable' },
    );
  },
  async removeMember(projectId: string, userId: string, actorId: string) {
    return prisma.$transaction(
      async (tx) => {
        const project = await tx.project.findUniqueOrThrow({
          where: { id: projectId },
          select: { workspaceId: true },
        });
        const member = await tx.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId } },
          select: { role: true },
        });
        if (member?.role === 'ADMIN') {
          const admins = await tx.projectMember.count({ where: { projectId, role: 'ADMIN' } });
          if (admins <= 1)
            throw new HttpError(
              409,
              'LAST_PROJECT_ADMIN',
              'A project must retain at least one administrator',
            );
        }
        await tx.projectMember.delete({ where: { projectId_userId: { projectId, userId } } });
        await tx.activityLog.create({
          data: {
            workspaceId: project.workspaceId,
            projectId,
            actorId,
            action: 'project.member_removed',
            metadata: { userId },
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  },
  listMembers(projectId: string) {
    return prisma.projectMember.findMany({
      where: { projectId },
      orderBy: { addedAt: 'asc' },
      select: {
        role: true,
        addedAt: true,
        user: { select: { id: true, name: true, email: true, imageUrl: true } },
      },
    });
  },
};
