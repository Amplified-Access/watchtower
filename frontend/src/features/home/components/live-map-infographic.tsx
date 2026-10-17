import LiveMapPreview from "./live-map-preview";
import styles from "./live-map-infographic.module.css";

// How it works, step 2: reports becoming the bigger picture, shown as the
// live incident map itself, as a globe: a ball on the page's white, as tall
// as the frames of steps 1 and 3, so the step connectors meet its top and
// bottom. A picture, with no sidebars, controls or interaction. Decorative,
// since the step's text says what it shows.

const LiveMapInfographic = () => (
  <div className={styles.root} aria-hidden="true">
    <div className={styles.ball}>
      <div className={styles.map}>
        <LiveMapPreview sphere />
      </div>
    </div>
  </div>
);

export default LiveMapInfographic;
