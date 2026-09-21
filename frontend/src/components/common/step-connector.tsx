import { cn } from "@/lib/utils";

type StepConnectorProps = {
  /** Column the line leaves from; it lands on the opposite column. */
  from: "left" | "right";
  className?: string;
};

/**
 * 1px line that drops from the bottom centre of one step's image, turns with
 * rounded corners, and lands on the top centre of the next step's image.
 *
 * Positioned against a two-column grid with a 4rem (gap-16) column gap: each
 * image's centre sits at (100% - 4rem) / 4 from its edge. The parent sets the
 * vertical placement and height (the gap between the two rows).
 */
const StepConnector = ({ from, className }: StepConnectorProps) => (
  <div
    aria-hidden
    className={cn(
      "pointer-events-none absolute inset-x-[calc((100%-4rem)/4)]",
      from === "right" && "-scale-x-100",
      className,
    )}
  >
    <div className="absolute left-0 top-0 h-1/2 w-1/2 rounded-bl-xl border-b border-l border-border" />
    <div className="absolute right-0 top-[calc(50%-1px)] bottom-0 w-1/2 rounded-tr-xl border-t border-r border-border" />
  </div>
);

export default StepConnector;
