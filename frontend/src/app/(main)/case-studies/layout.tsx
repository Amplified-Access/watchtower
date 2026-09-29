import { SanityLive } from "@/lib/sanity/live";

// Keeps the case study listing and every case study live: a publish in the
// Studio refreshes them for readers who have them open.
const CaseStudiesLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    {children}
    <SanityLive />
  </>
);

export default CaseStudiesLayout;
