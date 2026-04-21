"use client";

import { useParams } from "next/navigation";
import FormPreview from "@/features/admin/components/forms/form-preview-page";

const FormPreviewPage = () => {
  const params = useParams();
  const formId = params.slug as string;

  return <FormPreview formId={formId} />;
};

export default FormPreviewPage;
