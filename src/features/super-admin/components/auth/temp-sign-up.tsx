"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { superAdminSignUpFormSchema } from "../../schemas";
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
import { useRouter } from "next/navigation";

const AdminSignUpForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const [isSigningIn, setIsSigningIn] = useState(false);

  const router = useRouter();

  const form = useForm<z.infer<typeof superAdminSignUpFormSchema>>({
    resolver: zodResolver(superAdminSignUpFormSchema as any),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof superAdminSignUpFormSchema>) {
    console.log("Attempting sign up: ", values);

    try {
      const { data, error } = await authClient.signUp.email(
        {
          email: values.email, // user email address
          password: values.password, // user password -> min 8 characters by default
          name: values.name,
          image: undefined,
          callbackURL: "/superadmin/temp",
        },
        {
          onRequest: (ctx) => {
            setIsSigningIn(true);
          },
          onSuccess: (ctx) => {
            toast.success("Created user");
          },
          onError: (ctx) => {
            // display the error message
            toast.error(ctx.error.message);
          },
        }
      );

      if (error) {
        console.error("An exception occured while creating a user: " + error);
        throw new Error("Failed to create user");
      }
    } catch (error) {
      toast.error("Sign in failed");
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Backdoor</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="johndoe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="johndoe@amplifiedaccess.org"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full">
                    {isSigningIn ? <Loader /> : <span>Sign in</span>}
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

export default AdminSignUpForm;
