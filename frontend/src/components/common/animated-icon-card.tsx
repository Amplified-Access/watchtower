"use client";

import { useState } from "react";

const AnimatedIconCard = ({
  text,
  icon,
  number,
}: {
  text: string;
  icon: React.ComponentType<{
    animate?: boolean;
    strokeWidth?: number;
    size?: number;
  }>;
  number: number;
}) => {
  const [animate, setAnimate] = useState(false);
  const Icon = icon;
  return (
    <div
      className={
        "relative bg-white py-10 w-full rounded-2xl flex flex-col justify-center items-center border border-dark/40 border-dashed hover:cursor-pointer text-center transition-all duration-300 group"
      }
      onMouseEnter={() => setAnimate(true)}
      onMouseLeave={() => setAnimate(false)}
    >
      {/* ...no line here, line should be rendered by the parent grid... */}
      <div className="rounded-full size-16 grid place-items-center bg-background z-10">
        <Icon animate={animate} size={24} />
      </div>
      <h4 className="py-6 max-w-60 z-10">{text}</h4>
    </div>
  );
};

export default AnimatedIconCard;
