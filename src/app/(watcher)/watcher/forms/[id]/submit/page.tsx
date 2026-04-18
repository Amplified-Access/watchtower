import { Suspense } from "react";
import FormSubmissionContent from "@/features/watcher/components/forms/form-submission-content";
import Loader from "@/components/common/loader";

interface FormSubmissionPageProps {
  params: Promise<{
    id: string;
  }>;
}

const FormSubmissionPage = async ({ params }: FormSubmissionPageProps) => {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="32" />
        </div>
      }
    >
      <FormSubmissionContent formId={id} />
    </Suspense>
  );
};

export default FormSubmissionPage;
