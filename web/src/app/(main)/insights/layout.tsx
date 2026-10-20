import type { Metadata } from "next";
import { messagesPageMetadata } from "@/lib/seo/page";

// The page is a client component, so its title and description are set here,
// from the page's own copy in messages/*.json.
export const generateMetadata = (): Promise<Metadata> =>
  messagesPageMetadata("/insights", ["Insights", "pageTitle"], ["Insights", "pageDescription"]);

const InsightsLayout = ({ children }: { children: React.ReactNode }) => children;

export default InsightsLayout;
