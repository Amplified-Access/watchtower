import { NuqsAdapter } from "nuqs/adapters/next/app";
import { getLocale } from "next-intl/server";
import Header from "@/components/layout/header";
import { FooterContentProvider } from "@/components/layout/footer/footer-content";
import { getFooter } from "@/lib/sanity/content";
import { SanityLive } from "@/lib/sanity/live";

// Every public page. The footer's content (Sanity's `footer` document) is
// fetched here once and provided to the footer, which client pages render.
// <SanityLive /> is here too, since the footer puts Sanity content on every
// page: a publish in the Studio refreshes whatever page a reader has open.
const Layout = async ({ children }: { children: React.ReactNode }) => {
  const footer = await getFooter(await getLocale());
  return (
    <>
      <Header />
      <div>
        <NuqsAdapter>
          <FooterContentProvider content={footer}>{children}</FooterContentProvider>
        </NuqsAdapter>
      </div>
      <SanityLive />
    </>
  );
};

export default Layout;
