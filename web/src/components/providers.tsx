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
      {/* White, like the rest of the site. The site is light only and has no
          theme provider, so the default "system" theme followed the OS into
          dark mode. The icon carries the status: brand blue or red. */}
      <Toaster
        theme="light"
        toastOptions={{
          classNames: {
            toast: "font-title border-border shadow-lg",
            success: "[&_[data-icon]]:text-primary",
            error: "[&_[data-icon]]:text-destructive",
          },
        }}
      />
    </>
  );
}
