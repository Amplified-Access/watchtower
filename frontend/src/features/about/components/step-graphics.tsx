import InfographicBackdrop from "@/features/home/components/infographic-backdrop";
import { OUTCOMES } from "@/features/home/components/action-infographic";
import { cn } from "@/lib/utils";
import styles from "./step-graphics.module.css";

// The About page's step illustrations, in order: reporting, seeing the
// bigger picture, driving action. Pictures in the home page's illustration
// language (and its story: a water problem in Kibera, Nairobi, and its
// outcomes), not screenshots. Decorative: each step's text says what it
// shows. Step 1 is in Swahili, as on the home page, using the site's own
// Swahili form strings.

type GraphicProps = { className?: string };

const Frame = ({ className, pattern, children }: GraphicProps & { pattern?: boolean; children: React.ReactNode }) => (
  <div aria-hidden="true" className={cn(styles.root, className)}>
    <InfographicBackdrop pattern={pattern} />
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

// "See the bigger picture": an abstract dot map in CommonMind's style. A
// deterministic field of faint dots, with clusters of reports lit in white
// (brighter towards their middles) and pulsing gently. No real geography.
// 80 x 40 dots for the 2:1 frame; on phones the 4:3 frame crops the sides
// (slice), so the clusters sit towards the middle.
const MAP_W = 80;
const MAP_H = 40;
const CLUSTERS: [number, number, number][] = [
  [40, 22, 7],
  [24, 13, 5.5],
  [55, 11, 4.6],
  [58, 28, 4.2],
  [21, 30, 3.8],
  [66, 18, 2.8],
];
const MAP_DOTS = Array.from({ length: MAP_W * MAP_H }, (_, i) => {
  const x = i % MAP_W;
  const y = Math.floor(i / MAP_W);
  const n = Math.abs(Math.sin(x * 7.13 + y * 3.71) * 9301.17) % 1;
  const near = Math.min(...CLUSTERS.map(([cx, cy, r]) => Math.hypot(x - cx, y - cy) / r));
  const tone = near < 1 && n > 0.32 ? (n > 0.62 && near < 0.85 ? "lit" : "mid") : n > 0.55 ? "dim" : "base";
  return { x, y, tone, delay: (i % 13) * 0.27 };
});

// The backdrop's own dot pattern would muddle the grid, so it's left out.
const MapGraphic = ({ className }: GraphicProps) => (
  <Frame className={className} pattern={false}>
    <svg className={styles.map} viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid slice">
      {MAP_DOTS.map(({ x, y, tone, delay }) => (
        <circle
          key={`${x}-${y}`}
          cx={x + 0.5}
          cy={y + 0.5}
          r={tone === "lit" ? 0.3 : 0.26}
          className={styles[tone]}
          style={tone === "lit" ? { animationDelay: `${delay}s` } : undefined}
        />
      ))}
    </svg>
  </Frame>
);

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
export const STEP_GRAPHICS = [ReportGraphic, MapGraphic, ActionGraphic];
