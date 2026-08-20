import { z } from "zod";

/**
 * Mirrors the Laravel Form Requests. Client-side validation is UX only -- the
 * server revalidates everything and its verdict wins.
 */

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Enter a valid email address.")
    .max(160),
  password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Matches Laravel's Password::defaults(): min 12, letters and numbers. */
const passwordRule = z
  .string()
  .min(12, "Use at least 12 characters.")
  .regex(/\p{L}/u, "Include at least one letter.")
  .regex(/\d/, "Include at least one number.");

export const createUserSchema = z
  .object({
    name: z.string().min(1, "Name is required.").max(120),
    email: z.string().min(1, "Email is required.").email("Enter a valid email address.").max(160),
    phone: z.string().max(20).optional().or(z.literal("")),
    password: passwordRule,
    password_confirmation: z.string().min(1, "Confirm the password."),
    role: z.enum(["admin", "manager"]),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "The passwords do not match.",
    path: ["password_confirmation"],
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required.").max(120),
  email: z.string().min(1, "Email is required.").email("Enter a valid email address.").max(160),
  phone: z.string().max(20).optional().or(z.literal("")),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
