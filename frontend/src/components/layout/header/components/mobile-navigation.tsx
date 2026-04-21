"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { IoMenuOutline } from "react-icons/io5";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import Logo from "@/components/logo";
import { useTranslations } from "next-intl";
import LanguageSelector from "@/components/common/language-selector";

const MobileNavigation = ({ scrolled }: { scrolled: boolean }) => {
  const t = useTranslations("Navigation");
  const tCommon = useTranslations("Common");

  return (
    <Sheet>
      <SheetTrigger asChild className="lg:hidden">
        <IoMenuOutline className={cn("text-3xl", scrolled && "text-white")} />
      </SheetTrigger>
      <SheetContent className="bg-primary border-none text-background">
        <SheetHeader className="">
          <Logo className="object-contain object-left" color={"primary"} />
        </SheetHeader>
        <div className="grid gap-4 px-8 pt-8">
          <SheetClose asChild>
            <Link
              href={"/datasets-page"}
              className=" flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180 font-title"
            >
              {t("datasets")}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href={"/maps"}
              className=" flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180 font-title"
            >
              {t("maps")}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href={"/reports"}
              className=" flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180 font-title"
            >
              {t("reports")}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href={"/chat"}
              className=" flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180 font-title"
            >
              {t("chat")}
            </Link>
          </SheetClose>
        </div>
        <SheetFooter className="flex-row gap-2">
          <LanguageSelector
            variant="compact"
            className="bg-transparent text-background border-background hover:bg-background/10"
          />
          <SheetClose asChild>
            <Link
              href={"/sign-in"}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "bg-transparent text-background border-background font-title text-sm flex-1",
              )}
            >
              {tCommon("signIn")}
            </Link>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigation;
