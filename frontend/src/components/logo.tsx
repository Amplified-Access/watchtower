import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const Logo = ({
  className,
  color,
}: {
  className?: string;
  color: "white" | "primary";
}) => {
  return (
    <Link
      href={"/"}
      className={cn(
        "flex gap-2 items-center text-2xl font-semibold font-title"
      )}
    >
      <Image
        src={
          color != "white"
            ? "/images/logomark-white.png"
            : "/images/logomark.png"
        }
        alt={""}
        width={300}
        height={300}
        className={cn("h-9 w-full shrink-0", className)}
      />
    </Link>
  );
};

export default Logo;
