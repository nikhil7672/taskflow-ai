import { z } from 'zod';

const dateTime = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value));
const taskFieldsSchema = z.object({
  title: z.string().trim().min(1).max(240),
  description: z.string().max(20000).nullable().optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  parentId: z.string().cuid().nullable().optional(),
  startAt: dateTime.nullable().optional(),
  dueAt: dateTime.nullable().optional(),
});
export const taskCreateSchema = taskFieldsSchema.refine(
  (value) => !value.startAt || !value.dueAt || value.startAt <= value.dueAt,
  {
    message: 'Start date must be before or equal to due date',
  },
);

export const taskUpdateSchema = taskFieldsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });
export const taskStatusSchema = z.object({
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELED']),
});
export const taskAssigneeSchema = z.object({ assigneeId: z.string().cuid().nullable() });
export const taskCommentSchema = z.object({ content: z.string().trim().min(1).max(20000) });
export const taskDependencySchema = z.object({ dependsOnId: z.string().cuid() });
