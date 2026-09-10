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

/**
 * One shape for both creating and editing a user.
 *
 * Password fields are optional here and required by the mode-aware refinement
 * below. A single schema keeps `useForm` to one generic -- two schemas produced
 * a union of form types that TypeScript could not resolve at the call site.
 */
const userFormBase = z.object({
  name: z.string().min(1, "Name is required.").max(120),
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Enter a valid email address.")
    .max(160),
  phone: z.string().max(20).optional().or(z.literal("")),
  role: z.enum(["admin", "manager"], { message: "Choose a role." }),
  password: z.string().optional().or(z.literal("")),
  password_confirmation: z.string().optional().or(z.literal("")),
});

export type UserFormInput = z.infer<typeof userFormBase>;

/**
 * Password rules match Laravel's Password::defaults(): at least 12 characters,
 * containing a letter and a number. The breach check is server-side only --
 * it needs a network call and the server performs it regardless.
 */
export function userFormSchema(mode: "create" | "edit") {
  return userFormBase.superRefine((data, ctx) => {
    const password = data.password ?? "";
    const confirmation = data.password_confirmation ?? "";

    // Required on create; on edit the fields are not rendered at all.
    if (mode === "create" && password === "") {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Password is required.",
      });

      return;
    }

    if (password === "") {
      return;
    }

    if (password.length < 12) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Use at least 12 characters.",
      });
    }

    if (!/\p{L}/u.test(password)) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Include at least one letter.",
      });
    }

    if (!/\d/.test(password)) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Include at least one number.",
      });
    }

    if (password !== confirmation) {
      ctx.addIssue({
        code: "custom",
        path: ["password_confirmation"],
        message: "The passwords do not match.",
      });
    }
  });
}
