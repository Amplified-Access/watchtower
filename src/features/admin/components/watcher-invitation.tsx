"use client";

import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { watcherIvitationSchema } from "../schemas/watcher-invitation";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Loader from "@/components/common/loader";
import { Check } from "lucide-react";
import { trpc } from "@/_trpc/client";
import { authClient } from "@/lib/auth-client";
import { SendEmail } from "@/features/auth/server";

const WatcherInvitation = () => {
  const [isInviting, setIsInviting] = useState<boolean>(false);
  const [hasInvited, setHasInvited] = useState<boolean>(false);
  const {
    data: session,
    isPending, //loading state
    error, //error object
    refetch, //refetch the session
  } = authClient.useSession();
  const adminOrg = trpc.getAdminOrganization.useQuery({
    userId: session?.user.id || "",
  });
  const form = useForm<z.infer<typeof watcherIvitationSchema>>({
    resolver: zodResolver(watcherIvitationSchema as any),
    defaultValues: {
      name: "",
      email: "",
    },
  });
  const submitInviteMutation = trpc.inviteWatcher.useMutation();

  async function onSubmit(values: z.infer<typeof watcherIvitationSchema>) {
    setIsInviting(true);
    try {
      
      const organization =
        adminOrg.data && "organization" in adminOrg.data
          ? adminOrg.data.organizationId
          : null;
      const result = await submitInviteMutation.mutateAsync({
        ...values,
        organizationId: organization || "",
      });
      if ("error" in result && result.error) {
        toast.error(result.message);
        return;
      }
      
    } catch (error) {
      console.error(error)
      toast.error("Failed to invite watcher");
    } finally {
      setIsInviting(false);
      setTimeout(() => {
        setHasInvited(false);
      }, 1000);
    }
    console.log(values);
  }

  return (
    <div className=" mt-2  ">
      <h2 className="font-semibold text-xl pb-4 font-title">Invite a watcher</h2>
      <div className="p-8 bg-white rounded-md border">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex items-end gap-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-full max-w-96">
                  <div className="flex justify-between">
                    <FormLabel>Name</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="w-full max-w-96">
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
              type="submit"
              disabled={isInviting || hasInvited}
              className="hover:cursor-pointer"
            >
              {isInviting ? <Loader /> : hasInvited ? <Check /> : "Invite"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default WatcherInvitation;
