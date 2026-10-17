"use client";

import { BankIcon, Share08Icon, Target02Icon, VoteIcon, WheelchairIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import styles from "./action-infographic.module.css";

// How it works, step 3: what acting on reports achieves, as a timeline of
// the outcomes of the Uganda story (step 1's report): the local Centre for
// Inclusion using the evidence of inaccessible polling stations, through to
// temporary ramps and more accessible voting. The timeline slides
// along one outcome at a time, so the current one is always in the centre,
// filled blue and zoomed in, under the line from step 2 (which carries on
// down to it, to `landingRef`); three show at a time, the ones either side
// fading out towards the edges. Decorative, since the step's text says what it shows. The outcomes
// are in the reader's language: their keys under Infographics, in the order
// they happen. The About page's "Drive action" shows it too.

const OUTCOMES = [
  "outcomeEvidenceShared",
  "outcomeBarriersIdentified",
  "outcomeAuthoritiesEngaged",
  "outcomeRampsInstalled",
  "outcomeAccessibleVoting",
] as const;

const ICONS: Record<(typeof OUTCOMES)[number], IconSvgElement> = {
  outcomeEvidenceShared: Share08Icon,
  outcomeBarriersIdentified: Target02Icon,
  outcomeAuthoritiesEngaged: BankIcon,
  outcomeRampsInstalled: WheelchairIcon,
  outcomeAccessibleVoting: VoteIcon,
};

/** How long each outcome holds the centre, in ms, including the slide. */
const STEP_MS = 2400;
/** The slide to the next outcome, in ms (as `.track`'s transition). */
const SLIDE_MS = 700;
/** The outcome shown under reduced motion: one with outcomes either side. */
const STILL_INDEX = 2;

// The outcomes three times over, so the outcomes either side of the centre
// are there whichever is current. The middle copy is the one that slides
// through the centre; past its end, the timeline jumps back to the same
// outcome in it, unseen.
const COPIES = 3;
const N = OUTCOMES.length;

// `landingRef`: where the line from step 2 ends, just above the current
// outcome's number (home-page.tsx, StepConnector's landOn).
const ActionInfographic = ({ landingRef }: { landingRef?: React.Ref<HTMLDivElement> }) => {
  const t = useTranslations("Infographics");
  const ref = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  // The current outcome's place in the middle copy: N, one past the end,
  // only for the slide before the jump back to 0.
  const [index, setIndex] = useState(0);
  const [sliding, setSliding] = useState(true);

  // Runs only while on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!onScreen || reducedMotion) return;
    const timer = window.setInterval(() => {
      setSliding(true);
      setIndex((i) => i + 1);
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [onScreen, reducedMotion]);

  // Once the slide past the last outcome ends, back to the first, unseen:
  // the same outcome, in the same place, one copy along.
  useEffect(() => {
    if (index < N) return;
    const timer = window.setTimeout(() => {
      setSliding(false);
      setIndex(0);
    }, SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [index]);

  const current = reducedMotion ? STILL_INDEX : index;

  return (
    <div ref={ref} className={styles.root} aria-hidden="true">
      <div ref={landingRef} className={styles.landing} />
      <div className={styles.timeline}>
        <div className={styles.line} />
        {/* Left to right in every language, like the line it sits on. */}
        <div
          dir="ltr"
          className={cn(styles.track, sliding && styles.sliding)}
          style={{ "--pos": N + current } as React.CSSProperties}
        >
          {Array.from({ length: COPIES }, (_, copy) =>
            OUTCOMES.map((outcome, i) => {
              const position = copy * N + i;
              return (
                <div
                  key={position}
                  className={styles.step}
                  data-active={position === N + current}
                  data-done={position < N + current}
                >
                  <span className={styles.number}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.node}>
                    <HugeiconsIcon icon={ICONS[outcome]} strokeWidth={1.75} />
                  </span>
                  <span className={styles.label} dir="auto">
                    {t(outcome)}
                  </span>
                </div>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionInfographic;
