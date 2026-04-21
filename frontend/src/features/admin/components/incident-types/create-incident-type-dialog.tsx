"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/_trpc/client";
import { toast } from "sonner";

const createIncidentTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
});

type CreateIncidentTypeFormData = z.infer<typeof createIncidentTypeSchema>;

interface CreateIncidentTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateIncidentTypeDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateIncidentTypeDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateIncidentTypeFormData>({
    resolver: zodResolver(createIncidentTypeSchema as any),
    defaultValues: {
      name: "",
      description: "",
      color: "#ef4444",
    },
  });

  const createIncidentTypeMutation =
    trpc.createIncidentTypeForOrganization.useMutation({
      onSuccess: (result) => {
        if (result.isExisting) {
          toast.success("Existing incident type enabled for your organization");
        } else {
          toast.success(
            "New incident type created and enabled for your organization"
          );
        }
        form.reset();
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create incident type");
        setIsSubmitting(false);
      },
    });

  const onSubmit = async (data: CreateIncidentTypeFormData) => {
    setIsSubmitting(true);
    try {
      await createIncidentTypeMutation.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        color: data.color,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Incident Type</DialogTitle>
          <DialogDescription>
            Create a new incident type or enable an existing one for your
            organization. If the type already exists, it will be enabled for
            your organization instead of creating a duplicate.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Violence against civilians"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    A clear, descriptive name for this incident type. If this
                    name already exists, the existing type will be enabled for
                    your organization.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a detailed description of this incident type..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description to help users understand when to use
                    this incident type.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="color"
                        {...field}
                        disabled={isSubmitting}
                        className="w-12 h-10 p-1 rounded cursor-pointer"
                      />
                      <Input
                        type="text"
                        placeholder="#ef4444"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        disabled={isSubmitting}
                        className="flex-1"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Choose a color for this incident type. This will be used for
                    markers on maps and other visual elements.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Incident Type"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
