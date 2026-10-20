import Image from "next/image";

// The How it works illustrations' background, in the style of the About
// page's hero (features/about/components/about-page.tsx): the brand blue
// fading lighter towards the bottom over white, a fine grain, and the brand
// pattern twice, the second turned round (left out with `pattern={false}`,
// for a picture that is itself a dot pattern). Sits behind the
// illustration's cards: its parent must be `isolation: isolate`.

// The grain, drawn by the browser rather than shipped as an image (as on
// the About page).
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const InfographicBackdrop = ({ pattern = true }: { pattern?: boolean }) => (
  <>
    <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-primary via-primary/85 to-primary/60" />
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 opacity-25 mix-blend-soft-light"
      style={{ backgroundImage: GRAIN }}
    />
    {pattern && (
      <>
        <Image
          src="/brand/Pattern.svg"
          alt=""
          width={1378}
          height={617}
          className="pointer-events-none absolute top-[38%] -left-1/4 -z-10 h-auto w-full scale-150 opacity-60 invert"
        />
        <Image
          src="/brand/Pattern.svg"
          alt=""
          width={1378}
          height={617}
          className="pointer-events-none absolute top-[52%] -right-1/3 -z-10 h-auto w-full rotate-180 scale-150 opacity-60 invert"
        />
      </>
    )}
  </>
);

export default InfographicBackdrop;
