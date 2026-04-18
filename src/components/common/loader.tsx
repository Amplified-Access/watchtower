import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

const Loader = ({ size, className }: { size?: string; className?: string }) => {
  return <LoaderCircle size={size} className={cn("animate-spin", className)} />;
};

export default Loader;
