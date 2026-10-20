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

const WatcherInvitation = () => {
  const [isInviting, setIsInviting] = useState<boolean>(false);
  const [hasInvited, setHasInvited] = useState<boolean>(false);
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
      await submitInviteMutation.mutateAsync({ ...values });
      setHasInvited(true);
      toast.success(`Invite sent to ${values.email}`);
      form.reset();
      setTimeout(() => setHasInvited(false), 2000);
    } catch (error) {
      console.error(error);
      toast.error("Failed to invite watcher");
    } finally {
      setIsInviting(false);
    }
  }

  // Name, email and Invite in one row, filled with the muted grey like the
  // dashboards' other top rows; each field's message shows beneath it.
  return (
    <div>
      <div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-3 sm:flex-row sm:items-start"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="gap-1 sm:flex-1">
                  <FormLabel className="sr-only">Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Watcher's name"
                      className="bg-muted border-transparent shadow-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="gap-1 sm:flex-1">
                  <FormLabel className="sr-only">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Their email address"
                      className="bg-muted border-transparent shadow-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isInviting || hasInvited}
              className="hover:cursor-pointer"
            >
              {isInviting ? <Loader /> : hasInvited ? <Check /> : "Invite watcher"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default WatcherInvitation;
