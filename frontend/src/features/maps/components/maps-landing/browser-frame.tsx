import { cn } from "@/lib/utils";

interface BrowserFrameProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  url?: string;
}

// Translucent "browser window" chrome used by the maps landing page mockups.
// Purely decorative, so the chrome itself is hidden from assistive tech.
const BrowserFrame = ({
  children,
  className,
  contentClassName,
  url = "www.thewatchtower.tech",
}: BrowserFrameProps) => {
  return (
    <div
      className={cn(
        "rounded-t-xl bg-white/35 px-3 pt-2.5 ring-1 ring-white/40 backdrop-blur-sm md:px-5",
        className,
      )}
    >
      <div aria-hidden className="relative flex h-7 items-center md:h-8">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-white md:size-3" />
          <span className="size-2.5 rounded-full bg-white md:size-3" />
          <span className="size-2.5 rounded-full bg-white md:size-3" />
        </div>
        <div className="absolute left-1/2 hidden h-full w-2/5 -translate-x-1/2 items-center justify-center rounded-full bg-white/60 text-[10px] text-dark/60 sm:flex md:text-xs">
          {url}
        </div>
      </div>
      <div className={cn("mt-2.5 overflow-hidden bg-white md:mt-4", contentClassName)}>
        {children}
      </div>
    </div>
  );
};

export default BrowserFrame;
