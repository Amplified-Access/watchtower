"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { organizationApplicationSchema } from "../schemas/organization-registration-scema";
import { useState } from "react";
// import { FileUpload } from "./file-upload";
import { trpc } from "@/_trpc/client";
import Loader from "@/components/common/loader";
import { toast } from "sonner";
import FileUpload from "./file-upload";
import { uploadFile } from "@/utils/file-upload";
import Link from "next/link";

const OrganizationRegistrationForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const [file, setFile] = useState<{ file: File } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof organizationApplicationSchema>>({
    resolver: zodResolver(organizationApplicationSchema as any),
    defaultValues: {
      organizationName: "",
      applicantName: "",
      applicantEmail: "",
      website: "",
    },
  });

  const submitApplicationMutation =
    trpc.submitOrganizationApplication.useMutation();

  console.log(submitApplicationMutation.isPending);

  const UploadFileToCloudFlare = async (file: File | undefined) => {
    setIsLoading(true);
    console.log("file: ", file);

    if (!file) {
      // toast.error("Cerificate of incorporation needed.");
      return;
    }

    try {
      return { fileKey: await uploadFile(file) };
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Server error during file upload",
      );
      return null;
    }
  };

  const onSubmit = async (
    values: z.infer<typeof organizationApplicationSchema>,
  ) => {
    // console.log(file);

    const fileResponse = await UploadFileToCloudFlare(file?.file);

    if (!fileResponse || !fileResponse.fileKey) {
      // Handle the case where file upload failed
      toast.error("Please provide your certificate of incorporation.");
      setIsLoading(false);
      return;
    }

    try {
      const result = (await submitApplicationMutation.mutateAsync({
        ...values,
        certificateOfIncorporation: fileResponse.fileKey,
      })) as { error?: string; message?: string } | null;
      if (result?.error) {
        toast.error(result.message, {
          description: "Ensure the email hasnt been used before",
        });
        return;
      }
      toast.success("Application submitted successfully");
      // Display success message (replace with a proper modal/toast in a real app)
      // alert(result.message); // Using alert for simplicity, consider a better UI
      // Reset the form after successful submission
      form.reset();
      setFile(null);
    } catch (error: any) {
      console.error("Error submitting application:", error);
      // Display error message
      toast.error(
        `Submission failed: ${error.message || "An unknown error occurred."}`,
      ); // Using alert for simplicity
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      <h1 className="text-center font-title text-4xl font-semibold leading-tight text-dark">
        Register organisation
      </h1>
      <p className="mt-4 text-center text-base text-dark/60">
        Apply to bring your organisation onto WatchTower.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 md:mt-10">
          <div className="flex flex-col gap-6">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem className="gap-3">
                  <div className="flex justify-between">
                    <FormLabel className="font-title text-base font-medium text-dark">
                      Organisation name
                    </FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Input
                      autoComplete="organization"
                      className="h-12 bg-white px-4 shadow-none md:text-base"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="applicantName"
              render={({ field }) => (
                <FormItem className="gap-3">
                  <div className="flex justify-between">
                    <FormLabel className="font-title text-base font-medium text-dark">
                      Applicant name
                    </FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Input
                      autoComplete="name"
                      className="h-12 bg-white px-4 shadow-none md:text-base"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="applicantEmail"
              render={({ field }) => (
                <FormItem className="gap-3">
                  <div className="flex justify-between">
                    <FormLabel className="font-title text-base font-medium text-dark">
                      Email
                    </FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      className="h-12 bg-white px-4 shadow-none md:text-base"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem className="gap-3">
                  <div className="flex justify-between">
                    <FormLabel className="font-title text-base font-medium text-dark">
                      Website
                    </FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Input
                      inputMode="url"
                      placeholder="https://"
                      className="h-12 bg-white px-4 shadow-none md:text-base"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormItem className="gap-3">
              <FormLabel className="font-title text-base font-medium text-dark">
                Certificate of incorporation
              </FormLabel>
              <FileUpload file={file} setFile={setFile} />
            </FormItem>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full rounded-full font-title text-base hover:cursor-pointer"
            >
              {isLoading ? <Loader /> : <span>Submit application</span>}
            </Button>
          </div>
          <p className="mt-4 text-center font-title text-base text-dark">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
};

export default OrganizationRegistrationForm;
