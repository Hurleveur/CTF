import { z } from 'zod';

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
