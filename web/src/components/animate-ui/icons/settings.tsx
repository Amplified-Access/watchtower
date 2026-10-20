"use client";

import * as React from "react";
import { motion } from "motion/react";

interface SettingsProps {
  animate?: boolean;
  strokeWidth?: number;
  size?: number;
}

function Settings({
  animate = false,
  strokeWidth = 2,
  size = 24,
}: SettingsProps) {
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
      animate={animate ? { rotate: [0, 90, 180, 270, 360] } : {}}
      transition={{ duration: 2, ease: "easeInOut" }}
    >
      <motion.path
        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
        animate={animate ? { pathLength: [1, 0.9, 1] } : {}}
        transition={{ duration: 0.6, ease: "easeInOut", delay: 0.2 }}
      />
      <motion.circle
        cx={12}
        cy={12}
        r={3}
        animate={animate ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.6, ease: "easeInOut", delay: 0.4 }}
      />
    </motion.svg>
  );
}

export { Settings, Settings as SettingsIcon };
