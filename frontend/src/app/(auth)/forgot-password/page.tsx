import Container from "@/components/common/container";
import { buttonVariants } from "@/components/ui/button";
import { GeneralForgotPasswordForm } from "@/features/auth/components/general-forgot-password-form";
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
      <Container className="grid place-items-center min-h-dvh py-12">
        <div className="max-w-96 w-full">
          <GeneralForgotPasswordForm />
        </div>
      </Container>
    </section>
  );
};

export default page;
