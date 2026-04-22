import Container from "@/components/common/container";
import AdminsContent from "@/features/super-admin/components/admins/admins-content";

const page = () => {
  return (
    <div className="pt-6">
      <Container size="lg">
        <AdminsContent />
      </Container>
    </div>
  );
};

export default page;
