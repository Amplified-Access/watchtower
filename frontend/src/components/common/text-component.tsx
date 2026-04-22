import { cn } from "@/lib/utils";

const TextComponent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("text-base md:text-lg text-dark/65 font-medium", className)}>
      {children}
    </div>
  );
};

export default TextComponent;
