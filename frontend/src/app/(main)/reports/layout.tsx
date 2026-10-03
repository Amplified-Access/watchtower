import type { Metadata } from "next";
import { messagesPageMetadata } from "@/lib/seo/page";

// The page is a client component, so its title and description are set here,
// from the page's own copy in messages/*.json.
export const generateMetadata = (): Promise<Metadata> =>
  messagesPageMetadata("/reports", ["Navigation", "reports"], ["Reports", "browseDescription"]);

const ReportsLayout = ({ children }: { children: React.ReactNode }) => children;

export default ReportsLayout;
