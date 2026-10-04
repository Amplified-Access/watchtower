"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./action-infographic.module.css";

// How it works, step 3: what acting on reports achieves. The outcomes of the
// story steps 1 and 2 tell (no water in Kibera), arriving one after another
// in the middle of the blue panel, with nothing around them. HTML and CSS
// keyframes (the timeline is in the stylesheet); decorative, since the
// step's text says what it shows.

const OUTCOMES = [
  "Shared with the district council",
  "Response team sent to Kibera",
  "Water supply restored",
  "Follow-up report published",
];

const ActionInfographic = () => {
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
      {/* eslint-disable-next-line @next/next/no-img-element -- a decorative texture, no sizing needed */}
      <img src="/brand/Pattern.svg" alt="" className={styles.dots} />
      <div className={styles.outcomes}>
        {OUTCOMES.map((outcome) => (
          <div key={outcome} className={styles.outcome}>
            <svg className={styles.check} viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="#0042e7" />
              <path className={styles.tick} d="m14 24.5 7 7 13-14" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className={styles.text}>{outcome}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActionInfographic;
