"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
// import { queryClient } from "@/_trpc/trpc";
import { Toaster } from "./ui/sonner";
import Provider from "@/_trpc/provider";
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
     <Provider>

        {children}
        {/* <ReactQueryDevtools /> */}
     </Provider>
      <Toaster richColors />
    </>
  );
}
