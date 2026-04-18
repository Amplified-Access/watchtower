import Container from "@/components/common/container";
import WatchersContent from "@/features/super-admin/components/watchers/watchers-content";

const page = () => {
  return (
    <div className="pt-2">
      <Container size="lg">
        <WatchersContent />
      </Container>
    </div>
  );
};

export default page;
