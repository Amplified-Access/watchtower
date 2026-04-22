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
import { useEffect, useState } from "react";
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
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

export function GeneralSignInForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isSignedIn, setIsSigninedIn] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const form = useForm<z.infer<typeof signInFormSchema>>({
    resolver: zodResolver(signInFormSchema as any),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const router = useRouter();
  const session = authClient.useSession();

  async function onSubmit(values: z.infer<typeof signInFormSchema>) {
    setIsSigningIn(true);
    try {
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      // toast.success("Not yet implemented");
      const { data, error } = await authClient.signIn.email(
        {
          /**
           * The user email
           */
          email: values.email,
          /**
           * The user password
           */
          password: values.password,
          /**
           * A URL to redirect to after the user verifies their email (optional)
           */
          /**
           * remember the user session after the browser is closed.
           * @default true
           */
          rememberMe: false,
        },
        {
          onRequest: (ctx) => {
            setIsSigningIn(true);
          },
          onSuccess: (ctx) => {
            console.log("Successfully signed in");
            setIsSigninedIn(true);
            setInterval(() => {
              setIsRedirecting(true);
            }, 500);
          },
          onError: (ctx) => {
            // display the error message
            toast.error(ctx.error.message);
          },
        },
      );
      console.log(data?.user);
    } catch (error) {
      toast.error("Sign in failed");
    } finally {
      setIsSigningIn(false);
      // setTimeout(() => {
      //   setIsSigninedIn(false);
      // }, 1000);
    }
    console.log(values);
  }
  const user = session?.data?.user;

  useEffect(() => {
    // We only want to run this after the session has finished loading
    if (session.isPending) {
      return;
    }
    // Check if the user is authenticated and has a role
    if (user && user.role) {
      if (user.role === "super-admin") {
        router.push("/superadmin");
      } else if (user.role === "admin") {
        router.push("/admin");
      } else if (user.role === "watcher") {
        router.push("/watcher");
      } else if (user.role === "independent-reporter") {
        router.push("/independent-reporter"); // Corrected to use a specific path
      }
    }
  }, [session.isPending, user, router]);

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
                <div className="flex flex-col gap-3">
                  <Button
                    disabled={isSignedIn || isSigningIn}
                    type="submit"
                    className="w-full hover:cursor-pointer"
                  >
                    {isSigningIn ? (
                      <Loader />
                    ) : isRedirecting ? (
                      <span className="text-sm">Redirecting...</span>
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
