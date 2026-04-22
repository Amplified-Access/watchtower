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
import { Suspense, useEffect, useState } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";

const PasswordReset = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const [isReset, setIsReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const form = useForm<z.infer<typeof passwordResetSchema>>({
    resolver: zodResolver(passwordResetSchema as any),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  const router = useRouter();
  const session = authClient.useSession();

  const params = useSearchParams();

  const token = params.get("token");
  const error = params.get("error");

  async function onSubmit(values: z.infer<typeof passwordResetSchema>) {
    setIsResetting(true);

    if (!token) {
      toast.error("Invalid password reset link. No token found.");
      setIsResetting(false);
      return;
    }

    try {
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      // toast.success("Not yet implemented");
      const { data, error } = await authClient.resetPassword(
        {
          newPassword: values.password,
          token: token || undefined,
        },
        {
          onRequest: (ctx) => {
            setIsResetting(true);
          },
          onSuccess: (ctx) => {
            console.log("Successfully reset password");
            setIsReset(true);
          },
          onError: (ctx) => {
            // display the error message
            toast.error(ctx.error.message);
          },
        }
      );
      if (error) {
        throw new Error("Failed to reset password");
      }
      console.log(data);
    } catch (error) {
      toast.error("Sign in failed");
    } finally {
      setIsResetting(false);
      setTimeout(() => {
        setIsReset(false);
        router.push("/sign-in");
      }, 1000);
    }
    console.log(values);
  }
  //   const user = session?.data?.user;

  //   useEffect(() => {
  //     // We only want to run this after the session has finished loading
  //     if (session.isPending) {
  //       return;
  //     }
  //     // Check if the user is authenticated and has a role
  //     if (user && user.role) {
  //       if (user.role === "super-admin") {
  //         router.push("/superadmin");
  //       } else if (user.role === "admin") {
  //         router.push("/admin");
  //       } else if (user.role === "watcher") {
  //         router.push("/watcher");
  //       } else if (user.role === "independent-reporter") {
  //         router.push("/independent-reporter"); // Corrected to use a specific path
  //       }
  //     }
  //   }, [session.isPending, user, router]);
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
              organization's administrator to initialize a password reset.
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
              This link has expired. Please contact your organization's
              administrator for a new invitation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
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
              {/* <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <a
                  href="/register-organization"
                  className="underline underline-offset-4"
                >
                  Register organization
                </a>
              </div> */}
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
