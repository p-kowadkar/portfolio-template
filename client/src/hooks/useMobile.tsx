import * as React from "react";

const MOBILE_BREAKPOINT = 768;

function detectMobile(): boolean {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isNarrow = window.innerWidth < MOBILE_BREAKPOINT;
  // True mobile: narrow viewport AND touch-capable (excludes touch laptops at full width)
  return isNarrow && hasTouch;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(
    () => typeof window !== 'undefined' ? detectMobile() : false
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(detectMobile());
    mql.addEventListener("change", onChange);
    window.addEventListener('resize', onChange);
    setIsMobile(detectMobile());
    return () => {
      mql.removeEventListener("change", onChange);
      window.removeEventListener('resize', onChange);
    };
  }, []);

  return isMobile;
}
