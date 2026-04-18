import Container from "@/components/common/container";
import { buttonVariants } from "@/components/ui/button";
import GeneralPasswordReset from "@/features/auth/components/general-password-reset-form";
import { cn } from "@/lib/utils";
import { Home } from "lucide-react";
import Link from "next/link";

const page = () => {
  return (
    <section className="">
      <Link
        href={"/"}
        className={cn(
          buttonVariants({ variant: "default", size: "icon" }),
          "absolute top-2 left-2"
        )}
      >
        <Home />
      </Link>
      <Container className="grid place-items-center h-full min-h-[100dvh]">
        <div className="w-96">
          <GeneralPasswordReset />
        </div>
      </Container>
    </section>
  );
};

export default page;
