import { Suspense } from "react";
import WatcherFormsContent from "@/features/watcher/components/forms/watcher-forms-content";
import Loader from "@/components/common/loader";

const WatcherFormsPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="32" />
        </div>
      }
    >
      <WatcherFormsContent />
    </Suspense>
  );
};

export default WatcherFormsPage;
