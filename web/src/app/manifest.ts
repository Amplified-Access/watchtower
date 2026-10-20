import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo/site";

// /manifest.webmanifest: the site's name, colours and icon for browsers
// (home screen shortcuts, the address bar colour on Android).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "browser",
    background_color: "#ffffff",
    theme_color: SITE.themeColor,
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
