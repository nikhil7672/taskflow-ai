import { z } from 'zod';

const dateOnly = z
  .string()
  .date()
  .transform((value) => new Date(`${value}T00:00:00.000Z`));
const projectFieldsSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(10000).nullable().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED']).optional(),
  color: z.string().max(32).nullable().optional(),
  startDate: dateOnly.nullable().optional(),
  dueDate: dateOnly.nullable().optional(),
});
export const projectCreateSchema = projectFieldsSchema.refine(
  (value) => !value.startDate || !value.dueDate || value.startDate <= value.dueDate,
  {
    message: 'Start date must be before or equal to due date',
  },
);

export const projectUpdateSchema = projectFieldsSchema
  .partial()
  .omit({ slug: true })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

export const projectMemberSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
});
export const projectListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(120).optional(),
});
