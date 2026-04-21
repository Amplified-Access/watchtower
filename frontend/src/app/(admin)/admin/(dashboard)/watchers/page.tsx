import Container from "@/components/common/container";
import WatcherInvitation from "@/features/admin/components/watcher-invitation";
import OrganizationWatchersContent from "@/features/admin/components/watchers/organization-watchers-content";

const page = () => {
  return (
    <section>
      <Container size="sm">
        <div className="space-y-8 pt-4">
          <WatcherInvitation />
          <OrganizationWatchersContent />
        </div>
      </Container>
    </section>
  );
};

export default page;
