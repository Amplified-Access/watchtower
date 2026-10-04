"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./action-infographic.module.css";

// How it works, step 3: insight turned into action. An action plan that
// follows up step 2's emerging pattern is worked through, task by task,
// while a case file fills and the findings are shared. A looping
// illustration in HTML and CSS keyframes (the timeline is in the
// stylesheet); decorative, since the step's text says what it shows.

const TASKS = [
  { label: "Review 48 verified reports", due: "Mon" },
  { label: "Export the evidence", due: "Tue" },
  { label: "Brief partner organisations", due: "Wed" },
  { label: "Present to the district council", due: "Thu" },
  { label: "Track the response", due: "Fri" },
];

// Added to the case file as the first three tasks are done.
const CASE_ITEMS = [
  { label: "48 reports", meta: "Verified" },
  { label: "Evidence pack", meta: "PDF" },
  { label: "Partner brief", meta: "Doc" },
];

const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <path d="M14 3v5h5" />
  </svg>
);

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

      <div className={`${styles.card} ${styles.plan}`}>
        <div className={styles.windowDots}>
          <span />
          <span />
          <span />
        </div>
        <div className={styles.planHeader}>
          <div>
            <p className={styles.cardLabel}>Public demonstrations · Nairobi</p>
            <p className={styles.title}>Action plan</p>
          </div>
          <div className={styles.count}>
            {TASKS.map((_, i) => (
              <span key={i}>{i} of {TASKS.length} done</span>
            ))}
            <span>{TASKS.length} of {TASKS.length} done</span>
          </div>
        </div>
        <div className={styles.progress}>
          <div className={styles.progressFill} />
        </div>

        <div className={styles.tasks}>
          {TASKS.map(({ label, due }) => (
            <div key={label} className={styles.task}>
              <span className={styles.flash} />
              <span className={styles.box}>
                <span className={styles.boxFill}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path className={styles.tick} d="m5 12.5 4.5 4.5L19 7.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </span>
              <span className={styles.taskText}>
                <span className={styles.label}>
                  {label}
                  <span className={styles.strike} />
                </span>
              </span>
              <span className={styles.due}>{due}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`${styles.card} ${styles.caseFile}`}>
        <div className={styles.caseHeader}>
          <FileIcon />
          <span className={styles.caseTitle}>Case file</span>
        </div>
        <div className={styles.items}>
          {CASE_ITEMS.map(({ label, meta }) => (
            <div key={label} className={styles.item}>
              <FileIcon />
              {label}
              <span className={styles.itemMeta}>{meta}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`${styles.card} ${styles.toast}`}>
        <svg viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="24" fill="#0042e7" />
          <path d="m14 24.5 7 7 13-14" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Shared with the district council
      </div>
    </div>
  );
};

export default ActionInfographic;
