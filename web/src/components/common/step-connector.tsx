"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import styles from "./step-connector.module.css";

/** Seconds for the pulse to run one connector; the next starts as it ends. */
const TRAVEL_S = 1.8;
/** The corners' radius, as rounded-xl. */
const RADIUS = 12;

type StepConnectorProps = {
  /** Column the line leaves from; it lands on the opposite column. */
  from: "left" | "right";
  /** Its place among the connectors, top first: the pulse runs them in turn. */
  order?: number;
  /** How many connectors there are, so the pulse returns to the first after the last. */
  count?: number;
  /**
   * An element in the next step to carry the line on down to, past the
   * connector's box: it lands on this element's bottom edge rather than on
   * the box's bottom, so the pulse runs the whole way. Must sit under the
   * landing column's centre.
   */
  landOn?: React.RefObject<HTMLElement | null>;
  className?: string;
};

/**
 * 1px line that drops from the bottom centre of one step's image, turns with
 * rounded corners, and lands on the top centre of the next step's image (or
 * carries on down into it, to `landOn`),
 * with a pulse of brand blue running along it from step to step (the
 * "energy" of CommonMind's diagrams).
 *
 * Positioned against a two-column grid with a 4rem (gap-16) column gap: each
 * image's centre sits at (100% - 4rem) / 4 from its edge. The parent sets the
 * vertical placement and height (the gap between the two rows). Drawn as an
 * SVG path measured to its box, so the corners keep their radius at any size
 * and the pulse can follow them.
 */
const StepConnector = ({ from, order = 0, count = 1, landOn, className }: StepConnectorProps) => {
  const ref = useRef<HTMLDivElement>(null);
  // `tail`: how far past the box's bottom the line carries on, to `landOn`.
  const [size, setSize] = useState<{ w: number; h: number; tail: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const target = landOn?.current;
      let tail = 0;
      if (target) {
        // Screen distances, scaled back to the box's own px: the How it
        // works section is zoomed (--viewport-scale), and offsetHeight is
        // not.
        const box = el.getBoundingClientRect();
        const scale = box.height / h || 1;
        tail = Math.max(0, (target.getBoundingClientRect().bottom - box.bottom) / scale);
      }
      setSize({ w, h, tail });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    // The target moves when anything between it and the step it's in
    // changes size (the step's text wrapping once the fonts load, say),
    // which moves it without resizing it: watch them all.
    for (let node = landOn?.current ?? null; node && !node.contains(el); node = node.parentElement) {
      observer.observe(node);
    }
    return () => observer.disconnect();
  }, [landOn]);

  // Down from the top left, round a corner, across, round a corner, down to
  // the bottom right (mirrored for a connector leaving the right column).
  // Half a pixel in from the edges keeps the 1px line crisp.
  const d = size
    ? (() => {
        const { w, h, tail } = size;
        const r = Math.min(RADIUS, h / 2, w / 2);
        const x0 = 0.5;
        const x1 = w - 0.5;
        const mid = Math.round(h / 2) - 0.5;
        return `M${x0},0 V${mid - r} A${r},${r} 0 0 0 ${x0 + r},${mid} H${x1 - r} A${r},${r} 0 0 1 ${x1},${mid + r} V${h + tail}`;
      })()
    : null;

  const timing = {
    "--cycle": `${TRAVEL_S * Math.max(count, 2)}s`,
    "--delay": `${order * TRAVEL_S}s`,
  } as React.CSSProperties;

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        // Above the steps: the next one comes later in the page, so it
        // would otherwise paint over a line carried on into it (`landOn`).
        "pointer-events-none absolute z-10 inset-x-[calc((100%-4rem)/4)]",
        from === "right" && "-scale-x-100",
        className,
      )}
    >
      {d && (
        <svg className="absolute inset-0 h-full w-full overflow-visible" fill="none">
          <path d={d} className="stroke-border" strokeWidth={1} />
          <path d={d} pathLength={100} className={cn(styles.pulse, styles.glow)} style={timing} />
          <path d={d} pathLength={100} className={cn(styles.pulse, styles.core)} style={timing} />
        </svg>
      )}
    </div>
  );
};

export default StepConnector;
