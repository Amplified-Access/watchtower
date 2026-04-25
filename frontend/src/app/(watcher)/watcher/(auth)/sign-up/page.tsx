import Container from "@/components/common/container";
import WatcherSignUpForm from "@/features/watcher/components/auth/watcher-sign-up-form";

const Page = () => {
  return (
    <section className="">
      <Container className="grid place-items-center h-full min-h-[100dvh]">
        <div className="w-96">
          <WatcherSignUpForm />
        </div>
      </Container>
    </section>
  );
};

export default Page;
