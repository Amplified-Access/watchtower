"use client";

import { createContext, useContext } from "react";
import type { FooterContent } from "@/lib/sanity/types";

// The footer's content, the `footer` document in Sanity. The (main) layout
// fetches it once and provides it here, because the footer is rendered by
// client page components that can't fetch from Sanity themselves.

const EMPTY_FOOTER: FooterContent = {
  attribution: "",
  organisation: { name: "", url: "" },
  columns: [],
  social: [],
  copyright: "",
  legalLinks: [],
};

const FooterContext = createContext<FooterContent | null>(null);

export const FooterContentProvider = ({
  content,
  children,
}: {
  content: FooterContent | null;
  children: React.ReactNode;
}) => <FooterContext.Provider value={content}>{children}</FooterContext.Provider>;

/** The footer's content, empty when Sanity has none. */
export const useFooterContent = () => useContext(FooterContext) ?? EMPTY_FOOTER;
