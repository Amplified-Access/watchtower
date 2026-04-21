import { Suspense } from "react";
import LiveIncidentMap from "@/features/maps/components/live-incident-map";
import Loader from "@/components/common/loader";

const page = async () => {
  return (
    <section>
      <Suspense
        fallback={
          <div className="w-full h-screen grid place-items-center">
            <Loader className="text-dark" size="24" />
          </div>
        }
      >
        <LiveIncidentMap />
      </Suspense>
    </section>
  );
};

export default page;
