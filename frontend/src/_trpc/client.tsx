// src/_trpc/client.ts
"use client";

import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "./routers/_app"; 

export const trpc = createTRPCReact<AppRouter>({});

/** Inferred return types of every procedure: RouterOutputs["getAllDatasets"]. */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
