"use client";

import { useParams } from "next/navigation";
import FormBuilder from "@/features/admin/components/forms/form-builder";

const EditFormPage = () => {
  const params = useParams();
  const formId = params.slug as string;

  return <FormBuilder formId={formId} />;
};

export default EditFormPage;
