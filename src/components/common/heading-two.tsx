import { cn } from "@/lib/utils";

const HeadingTwo = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h2
      className={cn(
        "font-semibold font-title text-3xl lg:text-4xl text-dark",
        className
      )}
    >
      {children}
    </h2>
  );
};

export default HeadingTwo;
