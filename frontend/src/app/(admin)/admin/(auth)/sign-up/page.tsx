import Container from "@/components/common/container";
import { SignUpForm } from "@/features/admin/components/auth/sign-up-form";

const Page = () => {
  return (
    <section className="">
      <Container className="grid place-items-center h-full min-h-[100dvh]">
        <div className="w-96">
          <SignUpForm />
        </div>
      </Container>
    </section>
  );
};

export default Page;
