import z from "zod";

export const watcherSignUpFormSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be greater than 3 characters" }),
    email: z
      .email({
        message: "Email must be valid",
      })
      .min(1, {
        message: "Email must not be empty",
      })
      .max(50),
    password: z.string().min(8, {
      message: "Password must be at least 8 characters",
    }),
    confirmPassword: z.string().min(8, {
      message: "Please confirm your password",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
