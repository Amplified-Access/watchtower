import { cn } from "@/lib/utils";

const H4 = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h4 className={cn("font-semibold text-xl text-dark font-title", className)}>
      {children}
    </h4>
  );
};

export default H4;
