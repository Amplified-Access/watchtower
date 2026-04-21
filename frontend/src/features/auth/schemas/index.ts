import { z } from "zod";

export const signInFormSchema = z.object({
  email: z
    .email({
      message: "must be valid",
    })
    .min(2)
    .max(50),
  password: z.string().min(8, {
    message: "at least 8 characters",
  }),
});

export const passwordResetSchema = z
  .object({
    password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });
