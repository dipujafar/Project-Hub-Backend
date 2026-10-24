import { z } from 'zod';

const createProjectZodSchema = z.object({
  body: z
    .object({
      projectName: z.string().trim().min(1, 'Project name is required'),
      repoUrl: z.string().trim().url('Enter a valid repository URL'),
      liveLink: z.string().trim().url('Enter a valid live URL'),
      description: z.string().trim().min(1, 'Description is required'),
    })
    .strict(),
});

const getAllProjectsZodSchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    searchTerm: z.string().trim().optional(),
    page: z
      .string()
      .regex(/^[1-9]\d*$/)
      .refine(value => Number.isSafeInteger(Number(value)), 'Invalid page')
      .optional(),
    limit: z
      .string()
      .regex(/^[1-9]\d*$/)
      .refine(value => Number.isSafeInteger(Number(value)), 'Invalid limit')
      .optional(),
  }),
});

const reviewProjectZodSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid project ID'),
  }),
  body: z
    .object({
      status: z.enum(['APPROVED', 'REJECTED']),
    })
    .strict(),
});

export const projectValidations = {
  createProjectZodSchema,
  getAllProjectsZodSchema,
  reviewProjectZodSchema,
};
