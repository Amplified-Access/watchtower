"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import InfographicBackdrop from "./infographic-backdrop";
import styles from "./action-infographic.module.css";

// How it works, step 3: what acting on reports achieves, each outcome its
// own card on a picker wheel like the iPhone's. The outcomes of the Kibera story (steps 1 and 2) roll
// up one at a time; each is checked as it reaches the centre, so the rows
// below are still to do and the rows above are done. HTML and CSS keyframes
// (the timeline is in the stylesheet); decorative, since the step's text
// says what it shows. Six rows, so the wheel never shows one twice; they
// reach the centre in this order. The outcomes are in the reader's
// language: their keys under Infographics (also used by the About page's
// still of the wheel). Each row takes its direction from its language, so
// in Urdu the check sits on the right.

export const OUTCOMES = [
  "outcomeShared",
  "outcomeTeamSent",
  "outcomeWaterRestored",
  "outcomeResidentsNotified",
  "outcomeFollowUp",
  "outcomeCouncilResponse",
] as const;

const ActionInfographic = () => {
  const t = useTranslations("Infographics");
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);

  // Runs only while on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setPaused(!entry.isIntersecting), { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={styles.root} data-paused={paused} aria-hidden="true">
      <InfographicBackdrop />
      <div className={styles.picker}>
        <div className={styles.wheel}>
          {OUTCOMES.map((outcome) => (
            <div key={outcome} className={styles.row} dir="auto">
              <span className={styles.box}>
                <span className={styles.fill}>
                  <svg viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="24" fill="#0042e7" />
                    <path className={styles.tick} d="m14 24.5 7 7 13-14" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </span>
              <span className={styles.text}>{t(outcome)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActionInfographic;
