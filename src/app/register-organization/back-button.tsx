"use client";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const BackButton = () => {
  const router = useRouter();

  const handleNavigateBack = () => {
    router.back();
  };
  return (
    <button
      className="relative hover:cursor-pointer"
      onClick={handleNavigateBack}
      aria-label="Go back to watchtower home"
    >
      <ChevronLeft className="md:text-white md:absolute md:top-1/2 md:-translate-y-1/2 md:-left-6" />
      <Image
        src={"/images/logomark-white.png"}
        alt={""}
        width={300}
        height={300}
        className="hidden md:block w-48 h-9 object-contain  top-0 left-0 "
      />
    </button>
  );
};

export default BackButton;
