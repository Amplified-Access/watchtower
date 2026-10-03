import type { Metadata } from "next";
import { messagesPageMetadata } from "@/lib/seo/page";

// The page is a client component, so its title and description are set here,
// from the page's own copy in messages/*.json.
export const generateMetadata = (): Promise<Metadata> =>
  messagesPageMetadata("/datasets-page", ["Navigation", "datasets"], ["Datasets", "browseDescription"]);

const DatasetsLayout = ({ children }: { children: React.ReactNode }) => children;

export default DatasetsLayout;
