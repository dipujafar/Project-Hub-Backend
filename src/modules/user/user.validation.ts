import { z } from 'zod';

const createUserZodSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().trim().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    role: z.enum(['STUDENT', 'MENTOR']).optional(),
  }).strict(),
});

export const userValidations = {
  createUserZodSchema,
};