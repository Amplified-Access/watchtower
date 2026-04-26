"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { passwordResetSchema } from "../schemas";
import { toast } from "sonner";
import { Suspense, useState } from "react";
import Loader from "@/components/common/loader";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

const PasswordReset = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const [isReset, setIsReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const form = useForm<z.infer<typeof passwordResetSchema>>({
    resolver: zodResolver(passwordResetSchema as any),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const error = params.get("error");

  async function onSubmit(values: z.infer<typeof passwordResetSchema>) {
    if (!token) {
      toast.error("Invalid password reset link. No token found.");
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(body?.error ?? "Failed to reset password");
        return;
      }

      setIsReset(true);
      setTimeout(() => {
        router.push("/sign-in");
      }, 1000);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsResetting(false);
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Card className="w-full max-w-lg">
          <CardContent>
            <h1 className="text-2xl font-semibold text-red-500 pb-3">
              Contact Admin
            </h1>
            <p className="text-gray-700">
              You cannot reset your own password. Please request your
              organization&apos;s administrator to initialize a password reset.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error === "INVALID_TOKEN") {
    return (
      <div className="flex flex-col gap-6 items-center justify-center min-h-screen">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-red-500">
              Invalid or Expired Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              This link has expired. Please contact your organization&apos;s
              administrator for a new invitation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="shadow-none rounded-lg py-6">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold font-title">
            Set a new password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repeat password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col gap-3">
                  <Button
                    disabled={isReset || isResetting}
                    type="submit"
                    className="w-full hover:cursor-pointer"
                  >
                    {isResetting ? (
                      <Loader />
                    ) : isReset ? (
                      <Check />
                    ) : (
                      <span>Confirm</span>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

const GeneralPasswordReset = () => {
  return (
    <Suspense>
      <PasswordReset />
    </Suspense>
  );
};

export default GeneralPasswordReset;
