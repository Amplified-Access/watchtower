import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const Logo = ({
  variant,
  className,
}: {
  variant?: "dark" | "light" | "mixed";
  className?: string;
}) => {
  return (
    <Link
      href={"/"}
      className={cn(
        {
          "text-background": variant == "light",
          "text-foreground": variant == "dark",
        },
        "flex w-fit gap-2 font-title text-2xl font-semibold",
        className
      )}
    >
      WatchTower
    </Link>
  );
};

export default Logo;
