import Container from "@/components/common/container";
import AdminsContent from "@/features/super-admin/components/admins/admins-content";

const Page = () => {
  return (
    <div className="pt-6">
      <Container size="lg">
        <AdminsContent />
      </Container>
    </div>
  );
};

export default Page;
