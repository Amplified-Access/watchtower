"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./voice-report-infographic.module.css";

// How it works, step 1: someone records a voice report in Swahili and the
// report form fills itself in, then is submitted. A looping illustration
// built from HTML and CSS keyframes (see the stylesheet for the timeline),
// so it stays sharp at any size and costs no video download. Decorative: the
// step's text says what it shows. The words in it are part of the picture,
// like the text in the videos it replaces, so they aren't translated.

// Waveform bars: height, oscillation period and offset, varied so the bars
// don't move in step.
const BARS = Array.from({ length: 22 }, (_, i) => ({
  h: `${30 + ((i * 37) % 70)}%`,
  d: `${0.7 + ((i * 13) % 6) / 10}s`,
  delay: `${-((i * 7) % 10) / 10}s`,
}));

const Chevron = () => (
  <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const MicIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4" />
  </svg>
);

const VoiceReportInfographic = () => {
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

      <div className={styles.form}>
        <div className={styles.windowDots}>
          <span />
          <span />
          <span />
        </div>
        <p className={styles.title}>Report an incident</p>

        <div className={styles.fields}>
          <div>
            <p className={styles.label}>Incident Category</p>
            <div className={styles.box}>
              <span className={`${styles.focus} ${styles.focusCategory}`} />
              <span className={`${styles.placeholder} ${styles.placeholderCategory}`}>Select incident type…</span>
              <span className={`${styles.value} ${styles.valueCategory}`}>
                <span className={styles.dot} />
                Water and sanitation
              </span>
              <Chevron />
            </div>
          </div>

          <div>
            <p className={styles.label}>Incident Location</p>
            <div className={styles.box}>
              <span className={`${styles.focus} ${styles.focusLocation}`} />
              <span className={`${styles.placeholder} ${styles.placeholderLocation}`}>Location</span>
              <span className={`${styles.value} ${styles.valueLocation}`}>
                <svg className={styles.pin} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Nakawa Market, Kampala, Uganda
              </span>
              <Chevron />
            </div>
          </div>

          <div>
            <p className={styles.label}>Incident Description</p>
            <div className={`${styles.box} ${styles.boxTall}`}>
              <span className={`${styles.focus} ${styles.focusDescription}`} />
              <span className={`${styles.placeholder} ${styles.placeholderDescription}`}>
                Describe what happened in your own words…
              </span>
              <span className={styles.value}>
                <span className={`${styles.typed} ${styles.descLine1}`}>No water at Nakawa Market for three days now.</span>
                <span className={`${styles.typed} ${styles.descLine2}`}>Many families are affected.</span>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.submit}>
          Submit report
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </div>

        <div className={styles.success}>
          <svg className={styles.check} viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#0042e7" />
            <path className={styles.checkMark} d="m14 24.5 7 7 13-14" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className={styles.successTitle}>Report submitted</p>
          <p className={styles.successText}>Thank you for speaking up.</p>
        </div>
      </div>

      <div className={styles.bubble}>
        <span className={styles.language}>
          <MicIcon />
          Kiswahili
        </span>
        <div className={styles.transcript}>
          <span className={`${styles.typed} ${styles.speech1}`}>Hakuna maji katika Soko la</span>
          <span className={`${styles.typed} ${styles.speech2}`}>Nakawa kwa siku tatu sasa.</span>
          <span className={`${styles.typed} ${styles.speech3}`}>Familia nyingi zimeathirika.</span>
        </div>
      </div>

      <div className={styles.recorder}>
        <div className={styles.mic}>
          <div className={styles.rings}>
            <span />
            <span />
          </div>
          <div className={styles.micButton}>
            <MicIcon className={styles.iconMic} />
            <svg className={styles.iconStop} viewBox="0 0 24 24" fill="currentColor">
              <rect x="5" y="5" width="14" height="14" rx="3" />
            </svg>
          </div>
        </div>
        <div className={styles.meta}>
          <div className={styles.status}>
            <span className={styles.statusIdle}>Tap to speak</span>
            <span className={styles.statusListening}>
              <span className={styles.recDot} style={{ position: "static" }} />
              Listening…
            </span>
            <span className={styles.statusDone}>Voice report · 0:06</span>
          </div>
          <div className={styles.wave}>
            {BARS.map((bar, i) => (
              <span key={i} style={{ "--h": bar.h, "--d": bar.d, "--delay": bar.delay } as React.CSSProperties} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceReportInfographic;
