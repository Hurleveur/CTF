import { z } from 'zod';
import { timingSafeCompare } from '@/lib/security';

// Strong password schema with comprehensive requirements
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)'
  );

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Signup validation schema
export const signupSchema = z.object({
  email: z.string().email('Invalid email format').max(320, 'Email too long'),
  password: passwordSchema,
  username: z.string()
    .min(2, 'Username must be at least 2 characters')
    .max(50, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .optional(),
  createDefaultProject: z.boolean().optional().default(true), // Default to true if not specified
  acceptPrivacyPolicy: z.boolean().optional(), // Privacy policy acceptance (handled separately in UI)
});

// Password reset request validation schema
export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email format').max(320, 'Email too long'),
});

// Password update validation schema
export const passwordUpdateSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => timingSafeCompare(data.password, data.confirmPassword), {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Generic validation result type
export interface ValidationResult<T> {
  ok: boolean;
  data?: T;
  errors?: Record<string, string[]>;
}

// Generic validation helper
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      ok: true,
      data: result.data,
    };
  }
  
  return {
    ok: false,
    errors: Object.fromEntries(Object.entries(result.error.flatten().fieldErrors).filter(([, value]) => value !== undefined)) as Record<string, string[]>,
  };
}

// Extract password regex for client-side validation
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Password validation message for client-side use
export const passwordMessage = 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)';
