"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        toast.error(body?.error ?? "Sign in failed");
        return;
      }

      setIsSignedIn(true);
      const role: string = body?.data?.user?.role ?? "";
      setTimeout(() => {
        window.location.href = roleRedirectPath(role);
      }, 400);
    } catch {
      toast.error("Sign in failed. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="shadow-none rounded-lg py-6">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold font-title">
            Sign in to WatchTower
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Email</FormLabel>
                        <FormMessage />
                      </div>
                      <FormControl>
                        <Input
                          placeholder="johndoe@amplifiedaccess.org"
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
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Password</FormLabel>
                        <FormMessage />
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="text-right -mt-3">
                  <Link
                    href="/forgot-password"
                    className="text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    disabled={isSignedIn || isSigningIn}
                    type="submit"
                    className="w-full hover:cursor-pointer"
                  >
                    {isSigningIn ? (
                      <Loader />
                    ) : isSignedIn ? (
                      <Check />
                    ) : (
                      <span>Sign in</span>
                    )}
                  </Button>
                </div>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <a
                  href="/register-organization"
                  className="underline underline-offset-4"
                >
                  Register organization
                </a>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
