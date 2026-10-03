"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type LoopingVideoProps = {
  src: string;
  /** A still of the first frame, shown until the video plays and instead of it under reduced motion. */
  poster: string;
  /** The video's own size, so its box is reserved before it loads. */
  width: number;
  height: number;
  className?: string;
};

/**
 * A silent, looping clip standing in for an image (the How it works steps).
 *
 * Nothing is downloaded until it is first scrolled near (`preload="none"`),
 * and it plays only while on screen, so several large clips on one page cost
 * nothing until they are seen. Readers who ask for reduced motion see the
 * poster instead. Decorative: the text beside it says what it shows.
 */
const LoopingVideo = ({ src, poster, width, height, className }: LoopingVideoProps) => {
  const ref = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const video = ref.current;
    if (!video || reduceMotion) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Browsers may refuse autoplay (data saver, low power): the poster stays.
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduceMotion]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      width={width}
      height={height}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      className={cn("h-auto w-full", className)}
    />
  );
};

export default LoopingVideo;
