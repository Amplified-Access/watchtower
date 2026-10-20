import { redirect } from "next/navigation";

// There used to be one reporting link for every organization, the general
// /anonymous-reports form. Each deployment now has its own, copied from the
// Deployments page, so the old address leads there.
export default function ReportingLinkPage() {
  redirect("/admin/deployments");
}
