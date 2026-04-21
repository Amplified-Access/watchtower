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

    // Reverting to the FormData approach, which is the most reliable way
    // to send file data with associated metadata like the file name.
    const formData = new FormData();

    // Correctly append the nested file object to the form data
    // The 'file' variable is an object, and the actual File is inside file.file
    formData.append("file", file);

    try {
      const response = await fetch("/api/file-upload", {
        method: "POST",
        body: formData,
        // No need to set Content-Type header manually with FormData
      });

      if (response.ok) {
        console.log("File uploaded successfully!");
        return response.json();
      } else {
        toast.error("Server error during file upload");
        console.error("File upload failed.");
        return null;
        // Handle server-side errors, e.g., show a user-friendly message
      }
    } catch (error) {
      toast.error("Error during file upload: " + error);
      return null;
    }
  };

  const onSubmit = async (
    values: z.infer<typeof organizationApplicationSchema>
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
      const result = await submitApplicationMutation.mutateAsync({
        ...values,
        certificateOfIncorporation: fileResponse.fileKey,
      });
      if (result.error) {
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
        `Submission failed: ${error.message || "An unknown error occurred."}`
      ); // Using alert for simplicity
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "w-full max-w-lg px-10 flex flex-col gap-4 rounded-2xl ",
        className
      )}
      {...props}
    >
      
      <h1 className="text-3xl font-semibold font-title w-full leading-tight">
        Start reporting
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-3">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between">
                    {/* <FormLabel>Organization Name</FormLabel> */}
                    {/* <FormMessage /> */}
                  </div>
                  <FormControl>
                    <Input
                      id="organizationName"
                      placeholder="Organization name"
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
                <FormItem>
                  <div className="flex justify-between">
                    {/* <FormLabel>Applicant Name</FormLabel>
                    <FormMessage /> */}
                  </div>
                  <FormControl>
                    <Input
                      id="applicantName"
                      placeholder="Applicant name"
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
                <FormItem>
                  <div className="flex justify-between">
                    {/* <FormLabel>Applicant Email</FormLabel>
                    <FormMessage /> */}
                  </div>
                  <FormControl>
                    <Input
                      id="applicantEmail"
                      type="email"
                      placeholder="E-mail"
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
                <FormItem>
                  <div className="flex justify-between">
                    {/* <FormLabel>Organization website</FormLabel>
                    <FormMessage /> */}
                  </div>
                  <FormControl>
                    <Input id="website" placeholder="Website" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="mt-2">
              <FormItem>
                {/* <FormLabel>Certificate of incorporation</FormLabel> */}
                <FileUpload file={file} setFile={setFile} />
              </FormItem>
            </div>
            <Button
              type="submit"
              className="w-full font-medium mt-4"
              disabled={isLoading}
            >
              {isLoading ? <Loader /> : "Register Organization"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default OrganizationRegistrationForm;
