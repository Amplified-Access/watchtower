import type { ImageLoader } from "next/image";
import type { CSSProperties } from "react";
import type { SanityImage } from "./types";

// Sanity's image CDN resizes and converts on the fly, so next/image asks it
// for each width directly instead of running Vercel's optimizer as well.
export const sanityImageLoader: ImageLoader = ({ src, width, quality }) => {
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "max");
  return url.toString();
};

const NO_CROP = { top: 0, bottom: 0, left: 0, right: 0 };

// The image's URL, cut to the editor's crop (Sanity's `rect` parameter, in
// pixels of the original).
export const sanityImageSrc = ({ url, crop, dimensions }: SanityImage & { url: string }) => {
  if (!crop || !dimensions) return url;
  const { width, height } = dimensions;
  const x = Math.round(crop.left * width);
  const y = Math.round(crop.top * height);
  const w = Math.round((1 - crop.left - crop.right) * width);
  const h = Math.round((1 - crop.top - crop.bottom) * height);
  if (w <= 0 || h <= 0 || (x === 0 && y === 0 && w === width && h === height)) return url;
  const src = new URL(url);
  src.searchParams.set("rect", `${x},${y},${w},${h}`);
  return src.toString();
};

// The focal point an editor set in the Studio, as fractions of the cropped
// image. The hotspot is relative to the full image, so it is re-expressed
// relative to the cropped area.
const focalPoint = (hotspot: NonNullable<SanityImage["hotspot"]>, crop: SanityImage["crop"]) => {
  const c = crop ?? NO_CROP;
  const within = (value: number, start: number, end: number) =>
    Math.min(1, Math.max(0, (value - start) / (1 - start - end)));
  return { x: within(hotspot.x, c.left, c.right), y: within(hotspot.y, c.top, c.bottom) };
};

// Keeps the focal point in view when the image is cropped again by `object-cover`.
export const hotspotStyle = ({ hotspot, crop }: Pick<SanityImage, "hotspot" | "crop">): CSSProperties | undefined => {
  if (!hotspot) return undefined;
  const { x, y } = focalPoint(hotspot, crop);
  return { objectPosition: `${x * 100}% ${y * 100}%` };
};

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const;

// The image as a link preview: 1200 by 630 (what Open Graph and X expect),
// cut around the editor's focal point, as a JPEG because some link-preview
// scrapers don't read WebP. Null when the image has no file.
export const sanityShareImageSrc = (image: SanityImage | null | undefined): string | null => {
  if (!image?.url) return null;
  const src = new URL(sanityImageSrc({ ...image, url: image.url }));
  src.searchParams.set("w", String(SHARE_IMAGE_SIZE.width));
  src.searchParams.set("h", String(SHARE_IMAGE_SIZE.height));
  src.searchParams.set("fit", "crop");
  src.searchParams.set("fm", "jpg");
  src.searchParams.set("q", "80");
  if (image.hotspot) {
    const { x, y } = focalPoint(image.hotspot, image.crop);
    src.searchParams.set("crop", "focalpoint");
    src.searchParams.set("fp-x", x.toFixed(3));
    src.searchParams.set("fp-y", y.toFixed(3));
  }
  return src.toString();
};
