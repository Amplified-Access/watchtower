"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import InfographicBackdrop from "./infographic-backdrop";
import styles from "./voice-report-infographic.module.css";

// How it works, step 1: a voice report, one stage at a time. A single white
// card morphs from the recording pill into the transcript bubble (Swahili)
// and then into the report form, which fills itself in and is submitted,
// before shrinking back to the pill. HTML and CSS keyframes (the timeline is
// in the stylesheet); decorative, since the step's text says what it shows.
// It's in the reader's language, like the rest of the page: the recorder and
// form use the real report form's strings (IncidentReporting), and the
// report itself (what's said, typed into the form) is in Infographics. The
// category is one of the maps' incident types, and like the address it
// stays as the API and Google return it, as on the real form.

// Written right to left, so the transcript is typed out from the right.
const RTL_LOCALES = new Set(["ur"]);

// Waveform bars: height, oscillation period and offset, varied so the bars
// don't move in step.
const BARS = Array.from({ length: 20 }, (_, i) => ({
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
  const t = useTranslations("Infographics");
  const form = useTranslations("IncidentReporting");
  const rtl = RTL_LOCALES.has(useLocale());
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
    <div ref={ref} className={styles.root} data-paused={paused} dir={rtl ? "rtl" : undefined} aria-hidden="true">
      <InfographicBackdrop />

      <div className={`${styles.centre} ${styles.halo}`}>
        <span />
        <span />
      </div>

      <div className={`${styles.centre} ${styles.card}`}>
        {/* 1. Recording */}
        <div className={`${styles.stage} ${styles.stageRecord}`}>
          <div className={styles.record}>
            <div className={styles.micButton}>
              <MicIcon className={styles.iconMic} />
              <svg className={styles.iconStop} viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="5" width="14" height="14" rx="3" />
              </svg>
            </div>
            <div className={styles.meta}>
              <div className={styles.status}>
                <span className={styles.statusIdle}>{form("recordVoiceReport")}</span>
                <span className={styles.statusListening}>
                  <span className={styles.recDot} />
                  {t("listening")}
                </span>
              </div>
              <div className={styles.wave}>
                {BARS.map((bar, i) => (
                  <span key={i} style={{ "--h": bar.h, "--d": bar.d, "--delay": bar.delay } as React.CSSProperties} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Transcript */}
        <div className={`${styles.stage} ${styles.stageTranscript}`}>
          <div className={styles.transcript}>
            <span className={styles.language}>
              <MicIcon />
              {t("transcriptLanguage")}
            </span>
            <div className={styles.lines}>
              {/* Broken to fill the bubble's width (each line under 96% of it). */}
              <span className={`${styles.typed} ${styles.speech1}`}>{t("transcript1")}</span>
              <span className={`${styles.typed} ${styles.speech2}`}>{t("transcript2")}</span>
            </div>
          </div>
        </div>

        {/* 3. The form */}
        <div className={`${styles.stage} ${styles.stageForm}`}>
          <div className={styles.form}>
            <p className={styles.title}>{form("title")}</p>
            <div className={styles.fields}>
              <div>
                <p className={styles.label}>{form("categoryLabel")}</p>
                <div className={styles.box}>
                  <span className={`${styles.focus} ${styles.focusCategory}`} />
                  <span className={`${styles.placeholder} ${styles.placeholderCategory}`}>{form("selectIncidentTypeCombo")}</span>
                  <span className={`${styles.value} ${styles.valueCategory}`}>
                    <span className={styles.dot} />
                    Community petitions
                  </span>
                  <Chevron />
                </div>
              </div>
              <div>
                <p className={styles.label}>{form("locationLabel")}</p>
                <div className={styles.box}>
                  <span className={`${styles.focus} ${styles.focusLocation}`} />
                  <span className={`${styles.placeholder} ${styles.placeholderLocation}`}>{form("locationPickerPlaceholder")}</span>
                  <span className={`${styles.value} ${styles.valueLocation}`}>
                    <svg className={styles.pin} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Kibera, Nairobi, Kenya
                  </span>
                  <Chevron />
                </div>
              </div>
              <div>
                <p className={styles.label}>{form("descriptionLabel")}</p>
                <div className={`${styles.box} ${styles.boxTall}`}>
                  <span className={`${styles.focus} ${styles.focusDescription}`} />
                  <span className={`${styles.placeholder} ${styles.placeholderDescription}`}>
                    {form("descriptionPrompt")}
                  </span>
                  <span className={styles.value}>
                    <span className={`${styles.typed} ${styles.desc1}`}>{t("description1")}</span>
                    <span className={`${styles.typed} ${styles.desc2}`}>{t("description2")}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.submit}>
              {form("submitReport")}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
          </div>
          <div className={styles.success}>
            <svg className={styles.check} viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="#0042e7" />
              <path className={styles.checkMark} d="m14 24.5 7 7 13-14" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className={styles.successTitle}>{t("submitted")}</p>
            <p className={styles.successText}>{t("thanks")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceReportInfographic;
