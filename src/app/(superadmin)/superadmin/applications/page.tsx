import Container from "@/components/common/container";
import ApplicationsContent from "@/features/super-admin/components/applications/applications-content";

const page = () => {
  return (
    <section>
      <Container size="lg">
        <div className="flex flex-col gap-2 pt-6">
          <ApplicationsContent />
        </div>
      </Container>
    </section>
  );
};

export default page;
