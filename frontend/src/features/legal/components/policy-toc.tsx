"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PolicyTocProps {
  label: string;
  items: { id: string; title: string }[];
}

// Numbered table of contents that highlights the section currently in view.
const PolicyToc = ({ label, items }: PolicyTocProps) => {
  const [activeId, setActiveId] = useState(items[0]?.id);

  useEffect(() => {
    // The active section is the last one whose top has scrolled past a line
    // a third of the way down the viewport (below the fixed header); above
    // the first section, that's the first item.
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight / 3;
      let current = items[0]?.id;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= line) current = item.id;
      }
      setActiveId(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);

  return (
    <nav aria-label={label}>
      <p className="border-b border-border px-6 py-6 font-title text-lg font-medium uppercase tracking-wide text-primary md:px-7">
        {label}
      </p>
      <ol className="flex flex-col gap-1 px-6 py-6 font-title md:px-7">
        {items.map((item, index) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={activeId === item.id ? "location" : undefined}
              className={cn(
                "grid grid-cols-[1.75rem_1fr] transition-colors hover:text-dark md:text-lg",
                activeId === item.id ? "text-dark" : "text-dark/45",
              )}
            >
              <span className="text-right text-dark">{index + 1}.</span>
              <span className="ps-1.5">{item.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default PolicyToc;
