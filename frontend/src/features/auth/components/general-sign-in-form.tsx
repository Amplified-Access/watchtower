"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signInFormSchema } from "../schemas";
import { toast } from "sonner";
import { useState } from "react";
import Loader from "@/components/common/loader";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Check } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

function roleRedirectPath(role: string): string {
  switch (role) {
    case "super-admin":
      return "/superadmin";
    case "admin":
      return "/admin";
    case "watcher":
      return "/watcher";
    case "independent-reporter":
      return "/independent-reporter";
    default:
      return "/";
  }
}

export function GeneralSignInForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("Auth");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const form = useForm<z.infer<typeof signInFormSchema>>({
    resolver: zodResolver(signInFormSchema as any),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof signInFormSchema>) {
    setIsSigningIn(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: values.email, password: values.password }),
      });

      const body = await res.json();

      if (!res.ok) {
        toast.error(body?.error ?? t("signInFailed"));
        return;
      }

      setIsSignedIn(true);
      const role: string = body?.data?.user?.role ?? "";
      setTimeout(() => {
        window.location.href = roleRedirectPath(role);
      }, 400);
    } catch {
      toast.error(t("signInFailedRetry"));
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      <h1 className="text-center font-title text-4xl font-medium text-dark md:text-5xl">
        {t("signInHeading")}
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 md:mt-10">
          <div className="flex flex-col gap-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="gap-3">
                  <div className="flex justify-between">
                    <FormLabel className="font-title text-base font-medium text-dark">
                      {t("email")}
                    </FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder={t("emailPlaceholder")}
                      className="h-12 bg-white px-4 shadow-none md:text-base"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="gap-3">
                  <div className="flex justify-between">
                    <FormLabel className="font-title text-base font-medium text-dark">
                      {t("password")}
                    </FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      className="h-12 bg-white px-4 shadow-none md:text-base"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Link
              href="/forgot-password"
              className="-mt-1 w-fit font-title text-lg text-primary underline-offset-4 hover:underline md:text-xl"
            >
              {t("forgotPassword")}
            </Link>
            <Button
              disabled={isSignedIn || isSigningIn}
              type="submit"
              className="h-11 w-full rounded-full font-title text-base hover:cursor-pointer"
            >
              {isSigningIn ? (
                <Loader />
              ) : isSignedIn ? (
                <Check />
              ) : (
                <span>{t("signIn")}</span>
              )}
            </Button>
          </div>
          <p className="mt-3 text-center font-title text-dark md:text-lg">
            {t("noAccount")}{" "}
            <Link
              href="/register-organization"
              className="text-primary underline-offset-4 hover:underline"
            >
              {t("registerOrganization")}
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
}
