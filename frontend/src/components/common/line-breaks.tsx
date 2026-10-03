import { Fragment } from "react";

// Text from Sanity with the editor's line breaks (Enter in a text field) as
// <br />, for headings the design breaks over two lines. `breakClassName`
// can keep the breaks to wider screens (e.g. "hidden md:inline"), where the
// text wraps on its own on a phone; a hidden break leaves a space in its place.
const LineBreaks = ({ text, breakClassName }: { text: string; breakClassName?: string }) => (
  <>
    {text.split("\n").map((line, index) => (
      <Fragment key={index}>
        {index > 0 && (breakClassName ? <>{" "}<br className={breakClassName} /></> : <br />)}
        {line}
      </Fragment>
    ))}
  </>
);

export default LineBreaks;
