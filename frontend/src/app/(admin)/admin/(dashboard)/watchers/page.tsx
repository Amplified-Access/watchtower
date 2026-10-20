import Container from "@/components/common/container";
import WatcherInvitation from "@/features/admin/components/watcher-invitation";
import OrganizationWatchersContent from "@/features/admin/components/watchers/organization-watchers-content";

const Page = () => {
  return (
    <Container size="lg" className="space-y-6 pb-6">
      <WatcherInvitation />
      <OrganizationWatchersContent />
    </Container>
  );
};

export default Page;
