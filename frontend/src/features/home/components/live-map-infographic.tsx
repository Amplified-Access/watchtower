import InfographicBackdrop from "./infographic-backdrop";
import LiveMapPreview from "./live-map-preview";
import styles from "./live-map-infographic.module.css";

// How it works, step 2: reports becoming the bigger picture, shown as the
// live incident map itself (as on the About page's steps): a picture, with
// no sidebars, controls or interaction, in the frame of steps 1 and 3. The
// backdrop shows until the map has loaded. Decorative, since the step's
// text says what it shows.

const LiveMapInfographic = () => (
  <div className={styles.root} aria-hidden="true">
    <InfographicBackdrop pattern={false} />
    <div className={styles.map}>
      <LiveMapPreview />
    </div>
  </div>
);

export default LiveMapInfographic;
