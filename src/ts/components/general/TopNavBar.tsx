import React from "react";

const TABS = ["overview", "coverage"] as const;
type Tab = typeof TABS[number];

export function useHashTab(defaultTab: Tab = "overview"): [Tab, (t: Tab) => void] {
  const get = () => {
    const raw = window.location.hash.replace(/^#\//, "") as Tab;
    return (TABS as readonly string[]).includes(raw) ? raw : defaultTab;
  };
  const [tab, setTab] = React.useState<Tab>(get());
  React.useEffect(() => {
    const onHash = () => setTab(get());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const push = (t: Tab) => { if (t !== tab) window.location.hash = `/${t}`; };
  return [tab, push];
}

export function TopNavBar() {
  const [tab, setTab] = useHashTab();
  const activeIdx = React.useMemo(() => TABS.indexOf(tab), [tab]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const sliderRef = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const el = tabRefs.current[activeIdx];
    const container = containerRef.current;
    const slider = sliderRef.current;
    if (!el || !container || !slider) return;
    const elRect = el.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    const left = elRect.left - cRect.left + container.scrollLeft;
    slider.style.transform = `translateX(${left}px)`;
    slider.style.width = `${elRect.width}px`;
    const padding = 24;
    const visibleStart = container.scrollLeft;
    const visibleEnd = visibleStart + container.clientWidth;
    const tabStart = left;
    const tabEnd = left + elRect.width;
    if (tabStart < visibleStart) {
      container.scrollTo({ left: Math.max(0, tabStart - padding), behavior: "smooth" });
    } else if (tabEnd > visibleEnd) {
      container.scrollTo({ left: tabEnd - container.clientWidth + padding, behavior: "smooth" });
    }
  }, [activeIdx]);
  React.useEffect(() => {
    const onResize = () => {
      const el = tabRefs.current[activeIdx];
      const container = containerRef.current;
      const slider = sliderRef.current;
      if (!el || !container || !slider) return;
      const elRect = el.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      const left = elRect.left - cRect.left + container.scrollLeft;
      slider.style.transform = `translateX(${left}px)`;
      slider.style.width = `${elRect.width}px`;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIdx]);

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const i = activeIdx;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = (i + 1) % TABS.length;
      setTab(TABS[next]);
      window.location.hash = `/${TABS[next]}`;
      tabRefs.current[next]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (i - 1 + TABS.length) % TABS.length;
      setTab(TABS[prev]);
      window.location.hash = `/${TABS[prev]}`;
      tabRefs.current[prev]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      setTab(TABS[0]); window.location.hash = `/${TABS[0]}`; tabRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      const last = TABS.length - 1;
      setTab(TABS[last]); window.location.hash = `/${TABS[last]}`; tabRefs.current[last]?.focus();
    }
  };

  return (
      <div className="mx-auto max-w-7xl px-4 py-2">
        <nav aria-label="Primary" className="relative" onKeyDown={onKeyDown}>
          <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-base-100 to-transparent md:hidden" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-base-100 to-transparent md:hidden" />
          <div
            ref={containerRef}
            className="relative -mb-px flex overflow-x-auto whitespace-nowrap no-scrollbar"
            role="tablist"
            aria-orientation="horizontal"
          >
            <div
              ref={sliderRef}
              className="pointer-events-none absolute bottom-0 h-[2px] rounded bg-primary transition-transform duration-300 ease-out"
              aria-hidden
            />
            {TABS.map((t, i) => {
              const isActive = t === tab;
              return (
                <a
                  key={t}
                  ref={(el) => (tabRefs.current[i] = el)}
                  href={`#/${t}`}
                  onClick={(e) => { e.preventDefault(); setTab(t); window.location.hash = `/${t}`; }}
                  className={[
                    "tab tab-lg tabs-bordered transition-colors px-3 md:px-4",
                    "focus:outline-none focus-visible:ring focus-visible:ring-primary/40 rounded-t",
                    isActive ? "tab-active font-medium text-base-content" : "text-base-content/70 hover:text-base-content"
                  ].join(" ")}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${t}`}
                >
                  <span className="inline-flex items-center gap-2">
                    {t === "overview" && (
                      <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-80"><path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
                    )}
                    {t === "coverage" && (
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden className="opacity-80">
                        <path fill="currentColor" d="M12 2l7 3v6c0 5.2-3.4 9.9-7 11c-3.6-1.1-7-5.8-7-11V5z"/>
                        <path fill="currentColor" d="M10.2 13.6l-2.2-2.2L6.6 12.8l3.6 3.6l6.2-6.2l-1.4-1.4z"/>
                      </svg>
                    )}
                    {t[0].toUpperCase() + t.slice(1)}
                  </span>
                </a>
              );
            })}
          </div>
        </nav>
      </div>
  );
}
