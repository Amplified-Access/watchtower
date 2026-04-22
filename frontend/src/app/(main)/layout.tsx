import { NuqsAdapter } from "nuqs/adapters/next/app";
import Header from "@/components/layout/header";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      <div>
        <NuqsAdapter>{children}</NuqsAdapter>
      </div>
    </>
  );
};

export default Layout;
