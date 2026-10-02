import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SHARE_IMAGE_SIZE } from "@/lib/sanity/image";
import { SITE } from "@/lib/seo/site";

// The site's default share image (/og-image.png, 1200 by 630): what a link to
// WatchTower shows on social media and in messaging apps when neither the
// page nor "Search and sharing" in the Studio has an image of its own.
//
// Drawn at build time from the brand (logo, blue, Epilogue), so changing the
// brand here changes it everywhere. The fonts beside this file are static
// instances of the variable Epilogue in public/fonts/epilogue: the image
// renderer (Satori) reads TTF but not WOFF2 or variable fonts.
export const dynamic = "force-static";

const here = join(process.cwd(), "src/app/og-image.png");
const asDataUri = (svg: Buffer) => `data:image/svg+xml;base64,${svg.toString("base64")}`;

export async function GET() {
  const [semiBold, regular, logo, icon] = await Promise.all([
    readFile(join(here, "Epilogue-SemiBold.ttf")),
    readFile(join(here, "Epilogue-Regular.ttf")),
    readFile(join(process.cwd(), "public/brand/logo-white.svg")),
    readFile(join(process.cwd(), "public/brand/icon-white.svg")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: SITE.themeColor,
          color: "white",
          fontFamily: "Epilogue",
          position: "relative",
        }}
      >
        {/* The mark, large and faint, as a backdrop. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori draws plain <img>, not next/image */}
        <img
          src={asDataUri(icon)}
          width={560}
          height={518}
          alt=""
          style={{ position: "absolute", right: -60, bottom: -70, opacity: 0.12 }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori draws plain <img>, not next/image */}
        <img src={asDataUri(logo)} width={384} height={65} alt={SITE.name} />
        <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 900 }}>
          <div style={{ fontSize: 76, fontWeight: 600, lineHeight: 1.08, letterSpacing: -1.5 }}>
            Report civic incidents in your language.
          </div>
          <div style={{ fontSize: 32, fontWeight: 400, lineHeight: 1.35, opacity: 0.85 }}>
            Anonymous reporting by voice or text, mapped to reveal patterns and drive action.
          </div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 400, opacity: 0.85 }}>{new URL(SITE.url).host.replace(/^www\./, "")}</div>
      </div>
    ),
    {
      ...SHARE_IMAGE_SIZE,
      fonts: [
        { name: "Epilogue", data: semiBold, weight: 600, style: "normal" },
        { name: "Epilogue", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
