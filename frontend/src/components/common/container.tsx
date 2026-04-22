"use client";
import { cn } from "@/lib/utils";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

const Container = ({
  children,
  className,
  size = "lg",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "free" | "lg" | "sm" | "xs" | "text";
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      className={cn(
        `${
          size == "lg"
            ? "max-w-[1440px]"
            : size == "sm"
            ? "max-w-[1280px]"
            : size == "xs"
            ? "max-w-6xl"
            : size == "text"
            ? "max-w-4xl"
            : "px-8"
        } w-full mx-auto px-4 md:px-8`,
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export default Container;
