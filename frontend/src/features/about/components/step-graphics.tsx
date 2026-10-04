import InfographicBackdrop from "@/features/home/components/infographic-backdrop";
import { OUTCOMES } from "@/features/home/components/action-infographic";
import { CATEGORIES, TOTAL, TREND_CHART, WEEKLY } from "@/features/home/components/trends-infographic";
import { cn } from "@/lib/utils";
import styles from "./step-graphics.module.css";

// The About page's step illustrations, in order: reporting, understanding
// trends, driving action. Stills in the home page's illustration language
// (and its story: a water problem in Kibera, Nairobi, its data and
// outcomes), not screenshots. Decorative: each step's text says what it
// shows. Step 1 is in Swahili, as on the home page, using the site's own
// Swahili form strings.

type GraphicProps = { className?: string };

const Frame = ({ className, children }: GraphicProps & { children: React.ReactNode }) => (
  <div aria-hidden="true" className={cn(styles.root, className)}>
    <InfographicBackdrop />
    {children}
  </div>
);

// A recorded voice note's waveform, still.
const WAVE = Array.from({ length: 20 }, (_, i) => 30 + ((i * 37) % 70));

const ReportGraphic = ({ className }: GraphicProps) => (
  <Frame className={className}>
    <div className={cn(styles.card, styles.recorder)}>
      <div className={styles.mic}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4" />
        </svg>
      </div>
      <div className={styles.recMeta}>
        <span className={styles.recLabel}>Ripoti ya sauti · 0:06</span>
        <div className={styles.wave}>
          {WAVE.map((h, i) => (
            <span key={i} style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
    <span className={styles.flow} />
    <div className={cn(styles.card, styles.form)}>
      <p className={styles.formTitle}>Ripoti tukio</p>
      <div className={styles.fields}>
        <div>
          <p className={styles.label}>Aina ya Tukio</p>
          <div className={styles.box}>
            <span className={styles.dot} />
            Community petitions
          </div>
        </div>
        <div>
          <p className={styles.label}>Mahali pa Tukio</p>
          <div className={styles.box}>
            <svg className={styles.pin} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Kibera, Nairobi, Kenya
          </div>
        </div>
        <div>
          <p className={styles.label}>Maelezo ya Tukio</p>
          <div className={cn(styles.box, styles.boxTall)}>
            <span>Hakuna maji katika Kibera kwa siku tatu sasa.</span>
            <span>Familia nyingi zimeathirika.</span>
          </div>
        </div>
      </div>
      <div className={styles.submit}>Wasilisha ripoti</div>
    </div>
  </Frame>
);

const TrendsGraphic = ({ className }: GraphicProps) => {
  const max = Math.max(...CATEGORIES.map((c) => c.value));
  return (
    <Frame className={className}>
      <div className={cn(styles.card, styles.trend)}>
        <p className={styles.cardLabel}>Reports, last 12 weeks</p>
        <p className={styles.total}>{TOTAL.toLocaleString("en")}</p>
        <svg className={styles.chart} viewBox={`0 0 ${TREND_CHART.width} 200`}>
          {TREND_CHART.gridY.map((gy) => (
            <line key={gy} className={styles.grid} x1="0" x2={TREND_CHART.width} y1={gy} y2={gy} />
          ))}
          <path className={styles.area} d={TREND_CHART.area} />
          <path className={styles.lineMark} d={TREND_CHART.line} />
          <circle className={styles.endDot} cx={TREND_CHART.end.x} cy={TREND_CHART.end.y} r="7.5" />
          <text className={styles.endLabel} x={TREND_CHART.end.x - 12} y={TREND_CHART.end.y - 14} textAnchor="end">
            {WEEKLY[WEEKLY.length - 1]} this week
          </text>
        </svg>
      </div>
      <div className={cn(styles.card, styles.types)}>
        <p className={styles.cardLabel}>By incident type</p>
        <div className={styles.rows}>
          {CATEGORIES.map(({ label, value }) => (
            <div key={label} className={styles.row}>
              <span className={styles.rowLabel}>{label}</span>
              <span className={styles.bar} style={{ width: `calc(${((value / max) * 14).toFixed(2)} * var(--u))` }} />
              <span className={styles.value}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
};

// The picker wheel, stopped: two done above, the centre just done, two to
// do below. Angle, scale and content opacity per position.
const WHEEL = [
  { slot: -2, a: "44deg", s: 0.84, o: 0.28 },
  { slot: -1, a: "22deg", s: 0.92, o: 0.45 },
  { slot: 0, a: "0deg", s: 1, o: 1 },
  { slot: 1, a: "-22deg", s: 0.92, o: 0.45 },
  { slot: 2, a: "-44deg", s: 0.84, o: 0.28 },
];

const ActionGraphic = ({ className }: GraphicProps) => (
  <Frame className={className}>
    <div className={styles.wheel}>
      {WHEEL.map(({ slot, a, s, o }, i) => (
        <div key={slot} className={styles.outcome} style={{ "--a": a, "--s": s, "--o": o } as React.CSSProperties}>
          {slot <= 0 ? (
            <svg className={styles.check} viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="#0042e7" />
              <path d="m14 24.5 7 7 13-14" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className={styles.circle} />
          )}
          <span className={styles.outcomeText}>{OUTCOMES[i]}</span>
        </div>
      ))}
    </div>
  </Frame>
);

/** One per About step, in order. A step added in Sanity beyond these shows none. */
export const STEP_GRAPHICS = [ReportGraphic, TrendsGraphic, ActionGraphic];
