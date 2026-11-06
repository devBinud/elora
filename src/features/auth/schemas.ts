import { z } from 'zod';

const email = z.string().trim().min(1, 'Enter your email.').email('Enter a valid email address.');

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.'),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(60, 'Keep it under 60 characters.'),
  email,
  password: z
    .string()
    .min(8, 'Use at least 8 characters.')
    .max(128, 'Use at most 128 characters.'),
});

export const resetSchema = z.object({ email });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type ResetValues = z.infer<typeof resetSchema>;
