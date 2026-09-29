import { hotspotStyle, sanityImageLoader, sanityImageSrc } from "./image";

const url = "https://cdn.sanity.io/images/p/production/abc-2000x1000.webp";
const dimensions = { width: 2000, height: 1000 };

describe("sanityImageSrc", () => {
  it("leaves an uncropped image alone", () => {
    expect(sanityImageSrc({ url, dimensions })).toBe(url);
    expect(sanityImageSrc({ url, dimensions, crop: { top: 0, bottom: 0, left: 0, right: 0 } })).toBe(url);
  });

  it("cuts the editor's crop out of the original, in pixels", () => {
    const src = new URL(sanityImageSrc({ url, dimensions, crop: { top: 0.1, bottom: 0.2, left: 0.25, right: 0.25 } }));
    expect(src.searchParams.get("rect")).toBe("500,100,1000,700");
  });

  it("keeps the crop when next/image adds a width", () => {
    const src = sanityImageSrc({ url, dimensions, crop: { top: 0, bottom: 0, left: 0.5, right: 0 } });
    const loaded = new URL(sanityImageLoader({ src, width: 640 }));
    expect(loaded.searchParams.get("rect")).toBe("1000,0,1000,1000");
    expect(loaded.searchParams.get("w")).toBe("640");
  });
});

describe("hotspotStyle", () => {
  it("positions on the focal point", () => {
    expect(hotspotStyle({ hotspot: { x: 0.3, y: 0.6 } })).toEqual({ objectPosition: "30% 60%" });
  });

  it("measures the focal point within the crop", () => {
    // The right half is kept; a hotspot three quarters across the original
    // is halfway across what remains.
    const style = hotspotStyle({ hotspot: { x: 0.75, y: 0.5 }, crop: { top: 0, bottom: 0, left: 0.5, right: 0 } });
    expect(style).toEqual({ objectPosition: "50% 50%" });
  });

  it("is unset without a hotspot", () => {
    expect(hotspotStyle({})).toBeUndefined();
  });
});
