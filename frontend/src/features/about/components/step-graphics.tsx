import InfographicBackdrop from "@/features/home/components/infographic-backdrop";
import { OUTCOMES } from "@/features/home/components/action-infographic";
import { cn } from "@/lib/utils";
import LiveMapPreview from "./live-map-preview";
import styles from "./step-graphics.module.css";

// The About page's step illustrations, in order: reporting, seeing the
// bigger picture (the live incident map, as a picture), driving action.
// Pictures in the home page's illustration language (and its story: a water
// problem in Kibera, Nairobi, and its outcomes), not screenshots. Decorative: each step's text says what it
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

// "See the bigger picture": the live incident map itself, as a picture (no
// sidebars, controls or interaction), filling the frame. The backdrop shows
// until the map has loaded.
const MapGraphic = ({ className }: GraphicProps) => (
  <Frame className={className} pattern={false}>
    <div className={styles.map}>
      <LiveMapPreview />
    </div>
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
