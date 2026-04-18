import { cn } from "@/lib/utils";
import Loader from "./loader";

interface PageLoaderProps {
  className?: string;
  size?: string;
}

const PageLoader = ({ className, size }: PageLoaderProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-[50vh] w-full",
        className
      )}
    >
      <Loader size={size} />
    </div>
  );
};

export default PageLoader;
