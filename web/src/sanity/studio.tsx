import { Studio as SanityStudio } from "sanity";
import config from "../../sanity.config";

// The Studio filling the window, rendered by pages/studio/[[...tool]].tsx.
const Studio = () => (
  <div style={{ position: "fixed", inset: 0, height: "100dvh" }}>
    <SanityStudio config={config} />
  </div>
);

export default Studio;
