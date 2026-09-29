"use client";

import Image, { type ImageProps } from "next/image";
import { hotspotStyle, sanityImageLoader, sanityImageSrc } from "@/lib/sanity/image";
import type { SanityImage as SanityImageData } from "@/lib/sanity/types";

type SanityImageProps = Omit<ImageProps, "src" | "alt" | "loader"> & { image: SanityImageData };

// next/image for an image from Sanity: served by Sanity's CDN at each width,
// cut to the editor's crop and positioned on their focal point, blurred in
// from its LQIP. A client component because the loader is a function, which a
// server component can't pass to next/image. Renders nothing for an image
// without an uploaded file.
const SanityImage = ({ image, style, ...props }: SanityImageProps) => {
  if (!image.url) return null;
  return (
    <Image
      {...props}
      src={sanityImageSrc({ ...image, url: image.url })}
      alt={image.alt ?? ""}
      loader={sanityImageLoader}
      style={{ ...hotspotStyle(image), ...style }}
      {...(image.lqip ? { placeholder: "blur", blurDataURL: image.lqip } : {})}
    />
  );
};

export default SanityImage;
