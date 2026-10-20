import Container from "@/components/common/container";
import OrganizationsContent from "@/features/super-admin/components/organizations/organizations-content";

const Page = () => {
  return (
    <section>
      <Container>
        <div className="pb-6">
          <OrganizationsContent />
        </div>
      </Container>
    </section>
  );
};

export default Page;
