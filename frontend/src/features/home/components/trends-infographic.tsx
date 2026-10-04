"use client";

import { useEffect, useRef, useState } from "react";
import InfographicBackdrop from "./infographic-backdrop";
import styles from "./trends-infographic.module.css";

// How it works, step 2: reports becoming insight. A 12-week trend draws
// itself, reports by category grow in, and an emerging pattern is called
// out. A looping illustration in HTML, SVG and CSS keyframes (the timeline
// is in the stylesheet); decorative, since the step's text says what it
// shows. The figures are illustrative but internally consistent: the weeks
// and the incident types both add up to the total. The types are the ones
// the maps use (the API's active incident types), in sentence case.

const WEEKLY = [68, 74, 71, 86, 92, 89, 105, 117, 113, 132, 143, 158];
const TOTAL = WEEKLY.reduce((sum, n) => sum + n, 0); // 1,248

const CATEGORIES = [
  { label: "Public demonstrations", value: 352 },
  { label: "Election irregularities", value: 286 },
  { label: "Police misconduct", value: 214 },
  { label: "Community petitions", value: 168 },
  { label: "Misuse of public funds", value: 132 },
  { label: "Abuse of office", value: 96 },
];

// The chart's own coordinates: 548 by 200, the baseline at y = 190, a value
// of 160 at y = 30. Gridlines every 50 reports.
const W = 548;
const BASE = 190;
const y = (value: number) => BASE - value;
const x = (i: number) => (i / (WEEKLY.length - 1)) * W;
const points = WEEKLY.map((value, i) => [x(i), y(value)] as const);

// A smooth curve through the weeks (Catmull-Rom as cubic Béziers, gentle
// tension so it doesn't overshoot the data).
const smooth = (pts: readonly (readonly [number, number])[]) =>
  pts.reduce((d, [px, py], i) => {
    if (i === 0) return `M${px},${py}`;
    const [x0, y0] = pts[Math.max(0, i - 2)];
    const [x1, y1] = pts[i - 1];
    const [x3, y3] = pts[Math.min(pts.length - 1, i + 1)];
    const t = 6;
    return `${d} C${x1 + (px - x0) / t},${y1 + (py - y0) / t} ${px - (x3 - x1) / t},${py - (y3 - y1) / t} ${px},${py}`;
  }, "");

const LINE = smooth(points);
const AREA = `${LINE} L${W},${BASE} L0,${BASE} Z`;
const [END_X, END_Y] = points[points.length - 1];

const TrendsInfographic = () => {
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

  const max = Math.max(...CATEGORIES.map((c) => c.value));

  return (
    <div ref={ref} className={styles.root} data-paused={paused} aria-hidden="true">
      <InfographicBackdrop />

      <div className={`${styles.card} ${styles.trend}`}>
        <div className={styles.windowDots}>
          <span />
          <span />
          <span />
        </div>
        <p className={styles.cardLabel}>Reports, last 12 weeks</p>
        <div className={styles.headline}>
          <span className={styles.total}>{TOTAL.toLocaleString("en")}</span>
          <span className={styles.change}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
            32% on the previous 12 weeks
          </span>
        </div>

        <svg className={styles.chart} viewBox={`0 0 ${W} 200`}>
          {[0, 50, 100, 150].map((v) => (
            <line key={v} className={styles.grid} x1="0" x2={W} y1={y(v)} y2={y(v)} />
          ))}
          <path className={styles.area} d={AREA} />
          <path className={styles.lineMark} d={LINE} pathLength={1} />
          <circle className={styles.endDot} cx={END_X} cy={END_Y} r="7.5" />
          <text className={styles.endLabel} x={END_X - 12} y={END_Y - 14} textAnchor="end">
            {WEEKLY[WEEKLY.length - 1]} this week
          </text>
        </svg>
        <div className={styles.months}>
          <span>Jul</span>
          <span>Aug</span>
          <span>Sep</span>
        </div>
      </div>

      <div className={`${styles.card} ${styles.categories}`}>
        <p className={styles.cardLabel}>By incident type</p>
        <div className={styles.rows}>
          {CATEGORIES.map(({ label, value }, i) => (
            <div key={label} className={`${styles.row} ${i > 0 ? styles.rowDimmed : ""}`}>
              <span className={styles.rowLabel}>{label}</span>
              <span className={styles.track}>
                <span className={styles.bar} style={{ "--w": `${(value / max) * 100}%` } as React.CSSProperties} />
                <span className={styles.value}>{value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={`${styles.card} ${styles.callout}`}>
        <span className={styles.pulse} />
        <div>
          <p className={styles.calloutLabel}>Emerging pattern</p>
          <p className={styles.calloutText}>Public demonstrations up 38% in Nairobi</p>
        </div>
      </div>
    </div>
  );
};

export default TrendsInfographic;
