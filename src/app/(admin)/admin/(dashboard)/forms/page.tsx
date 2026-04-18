import Container from "@/components/common/container";
import FormsContent from "@/features/admin/components/forms/forms-content";

const page = () => {
  return (
    <div className="p-6">
      <Container size="free">
        <FormsContent />
      </Container>
    </div>
  );
};

export default page;
