import * as React from "react"

const MOBILE_BREAKPOINT = 768

const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

// Defined once at module scope: passing fresh closures to
// useSyncExternalStore would resubscribe the media query listener after every
// render of every consumer.
function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}
  const mql = window.matchMedia(MOBILE_MEDIA_QUERY)
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

function getSnapshot() {
  return typeof window !== "undefined"
    ? window.matchMedia(MOBILE_MEDIA_QUERY).matches
    : false
}

// The server cannot know the viewport; it renders the desktop layout, and the
// client corrects it on hydration.
function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
