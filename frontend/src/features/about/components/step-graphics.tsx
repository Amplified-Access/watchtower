import { useTranslations } from "next-intl";
import InfographicBackdrop from "@/features/home/components/infographic-backdrop";
import ActionInfographic from "@/features/home/components/action-infographic";
import LiveMapPreview from "@/features/home/components/live-map-preview";
import { cn } from "@/lib/utils";
import styles from "./step-graphics.module.css";

// The About page's step illustrations, in order: reporting, seeing the
// bigger picture (the live incident map, as a picture), driving action (the
// home page's outcomes timeline itself).
// Pictures in the home page's illustration language (and its story: Center
// for Inclusion's work making elections in Uganda accessible to people with
// disabilities), not screenshots. Decorative: each step's text says what it
// shows. Like the home page's, they're in the reader's language: the real
// report form's strings (IncidentReporting) and the story's (Infographics).
// Cards take their direction from their language, so Urdu's are right to left.

type GraphicProps = { className?: string };

// `backdrop={false}` leaves the frame white, for a picture drawn for the page's
// white (the timeline).
const Frame = ({
  className,
  pattern,
  backdrop = true,
  children,
}: GraphicProps & { pattern?: boolean; backdrop?: boolean; children: React.ReactNode }) => (
  <div aria-hidden="true" className={cn(styles.root, className)}>
    {backdrop && <InfographicBackdrop pattern={pattern} />}
    {children}
  </div>
);

// A recorded voice note's waveform, still.
const WAVE = Array.from({ length: 20 }, (_, i) => 30 + ((i * 37) % 70));

const ReportGraphic = ({ className }: GraphicProps) => {
  const t = useTranslations("Infographics");
  const form = useTranslations("IncidentReporting");
  return (
    <Frame className={className}>
      <div className={cn(styles.card, styles.recorder)} dir="auto">
        <div className={styles.mic}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4" />
          </svg>
        </div>
        <div className={styles.recMeta}>
          <span className={styles.recLabel}>{form("voiceNote")} · 0:06</span>
          <div className={styles.wave}>
            {WAVE.map((h, i) => (
              <span key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
      <span className={styles.flow} />
      <div className={cn(styles.card, styles.form)} dir="auto">
        <p className={styles.formTitle}>{form("title")}</p>
        <div className={styles.fields}>
          <div>
            <p className={styles.label}>{form("categoryLabel")}</p>
            <div className={styles.box}>
              <span className={styles.dot} />
              {t("category")}
            </div>
          </div>
          <div>
            <p className={styles.label}>{form("locationLabel")}</p>
            <div className={styles.box}>
              <svg className={styles.pin} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Gulu, Uganda
            </div>
          </div>
          <div>
            <p className={styles.label}>{form("descriptionLabel")}</p>
            <div className={cn(styles.box, styles.boxTall)}>
              <span>{t("description1")}</span>
              <span>{t("description2")}</span>
            </div>
          </div>
        </div>
        <div className={styles.submit}>{form("submitReport")}</div>
      </div>
    </Frame>
  );
};

// "See the bigger picture": the live incident map itself, as a picture (no
// sidebars, controls or interaction), filling the frame. The backdrop shows
// until the map has loaded.
const MapGraphic = ({ className }: GraphicProps) => (
  <Frame className={className} pattern={false}>
    <div className={styles.map}>
      {/* Clear of the frame's fade at the bottom. */}
      <LiveMapPreview bottom={0.3} />
    </div>
  </Frame>
);

// "Drive action": the home page's How it works step 3, the outcomes timeline
// sliding along, on white as there (it runs only while on screen, and holds
// still under reduced motion).
const ActionGraphic = ({ className }: GraphicProps) => (
  <Frame className={className} backdrop={false}>
    <div className={styles.timeline}>
      <ActionInfographic />
    </div>
  </Frame>
);

/** One per About step, in order. A step added in Sanity beyond these shows none. */
export const STEP_GRAPHICS = [ReportGraphic, MapGraphic, ActionGraphic];
