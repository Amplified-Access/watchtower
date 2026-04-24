"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { forgotPasswordSchema } from "../schemas";
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
import { authClient } from "@/lib/auth-client";
import { Check } from "lucide-react";
import Link from "next/link";

export function GeneralForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema as any),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setIsSending(true);
    try {
      const { error } = await authClient.requestPasswordReset({
        email: values.email,
        redirectTo: "/reset-password",
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setIsSent(true);
      toast.success("Reset link sent — check your inbox");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="shadow-none rounded-lg py-6">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold font-title text-nowrap">
            Forgot your password?
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
                <Button
                  disabled={isSending || isSent}
                  type="submit"
                  className="w-full hover:cursor-pointer"
                >
                  {isSending ? (
                    <Loader />
                  ) : isSent ? (
                    <Check />
                  ) : (
                    <span>Send reset link</span>
                  )}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Remembered it?{" "}
                <Link href="/sign-in" className="underline underline-offset-4">
                  Back to sign in
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
