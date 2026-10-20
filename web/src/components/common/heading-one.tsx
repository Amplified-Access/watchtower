import { cn } from "@/lib/utils";

const HeadingOne = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h1
      className={cn(
        "text-3xl xs:text-4xl 2xl:text-5xl font-semibold text-dark leading-10 2xl:leading-14 font-title mb-6",
        className
      )}
      // style={
      //   {
      //     fontSize: "1.875rem",
      //   } as React.CSSProperties
      // }
    >
      {children}
    </h1>
  );
};

export default HeadingOne;
