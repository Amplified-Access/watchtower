import { Fragment } from "react";

// Text from Sanity with the editor's line breaks (Enter in a text field) as
// <br />, for headings the design breaks over two lines.
const LineBreaks = ({ text }: { text: string }) => (
  <>
    {text.split("\n").map((line, index) => (
      <Fragment key={index}>
        {index > 0 && <br />}
        {line}
      </Fragment>
    ))}
  </>
);

export default LineBreaks;
