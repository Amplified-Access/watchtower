// src/server/trpc.ts
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

// Create the tRPC context (add things like your database, etc.)
export const createTRPCContext = async (opts: { headers: Headers }) => {
  // Return the context object
  return {
    headers: opts.headers,
    // ... add other context data like a database client
  };
};

// Initialize tRPC
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Export reusable helpers
export const router = t.router;
export const publicProcedure = t.procedure;
export { t };
// ... you can create more procedures with middleware for things like auth
