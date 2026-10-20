/**
 * Insight bodies are stored as portable-text blocks: an array of blocks, each
 * with spans of text carrying marks. The backend keeps the body as opaque
 * JSON, so these describe what the renderer reads, and everything is
 * optional because an older record may not carry it.
 */
export interface PortableTextSpan {
  _type?: string;
  text?: string;
  /** "strong", "em", … */
  marks?: string[];
}

export interface PortableTextBlock {
  _type?: string;
  /** "normal", "h1".."h4", "blockquote". */
  style?: string;
  children?: PortableTextSpan[];
}

/** Reads a body of unknown provenance as blocks, or nothing. */
export function portableTextBlocks(content: unknown): PortableTextBlock[] {
  return Array.isArray(content) ? (content as PortableTextBlock[]) : [];
}
