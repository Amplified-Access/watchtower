"use client";

import * as React from "react";
import { motion } from "motion/react";

interface CloudUploadProps {
  animate?: boolean;
  strokeWidth?: number;
  size?: number;
}

function CloudUpload({
  animate = false,
  strokeWidth = 2,
  size = 24,
}: CloudUploadProps) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={animate ? { y: [0, -2, 0] } : {}}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <motion.path
        d="M12 13v8"
        animate={animate ? { pathLength: [1, 0.8, 1] } : {}}
        transition={{ duration: 0.6, ease: "easeInOut", delay: 0.1 }}
      />
      <motion.path
        d="m8 17 4-4 4 4"
        animate={animate ? { pathLength: [1, 0.8, 1] } : {}}
        transition={{ duration: 0.6, ease: "easeInOut", delay: 0.2 }}
      />
      <motion.path
        d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"
        animate={animate ? { pathLength: [1, 0.9, 1] } : {}}
        transition={{ duration: 0.6, ease: "easeInOut", delay: 0.3 }}
      />
    </motion.svg>
  );
}

export { CloudUpload, CloudUpload as CloudUploadIcon };
