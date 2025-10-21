import React, { JSX } from "react";

const TABS = ["overview", "coverage"] as const;
type Tab = typeof TABS[number];

const TAB_META: Record<Tab, {
  label: string;
  description: string;
  icon: (active: boolean) => JSX.Element;
}> = {
  overview: {
    label: "Overview",
    description: "Snapshot & trends",
    icon: (active) => (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        aria-hidden
        className={active ? "text-primary" : "text-base-content/60"}
      >
        <path
          fill="currentColor"
          d="M4 9h4v11H4zm6-6h4v17h-4zm6 11h4v6h-4z"
        />
      </svg>
    ),
  },
  coverage: {
    label: "Coverage Explorer",
    description: "Deep dive metrics",
    icon: (active) => (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        aria-hidden
        className={active ? "text-primary" : "text-base-content/60"}
      >
        <path
          fill="currentColor"
          d="M12 2l9 4v6c0 5.25-3.22 10.42-9 12c-5.78-1.58-9-6.75-9-12V6l9-4zm0 3.18L6 7.09v4.42c0 4.06 2.62 8.34 6 9.85c3.38-1.51 6-5.79 6-9.85V7.09l-6-1.91zm-1 10.82l-3.59-3.58L8.83 11L11 13.17l4.59-4.58L17 10l-6 6z"
        />
      </svg>
    ),
  },
};

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
    const top = elRect.top - cRect.top + container.scrollTop;
    slider.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    slider.style.width = `${elRect.width}px`;
    slider.style.height = `${elRect.height}px`;
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
      const top = elRect.top - cRect.top + container.scrollTop;
      slider.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      slider.style.width = `${elRect.width}px`;
      slider.style.height = `${elRect.height}px`;
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
      <div className="dash-section pb-4">
        <nav
          aria-label="Primary"
          className="relative overflow-hidden rounded-3xl border border-base-content/10 bg-gradient-to-br from-base-100/80 via-base-100/60 to-base-100/80 px-3 py-2 backdrop-blur-xl shadow-lg shadow-primary/5"
          onKeyDown={onKeyDown}
        >
          <div className="pointer-events-none absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-base-100/90 via-base-100/70 to-transparent md:hidden" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-base-100/90 via-base-100/70 to-transparent md:hidden" />
          <div
            ref={containerRef}
            className="relative flex gap-2 overflow-x-auto whitespace-nowrap no-scrollbar py-1"
            role="tablist"
            aria-orientation="horizontal"
          >
            <div
              ref={sliderRef}
              className="pointer-events-none absolute z-0 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/18 via-primary/12 to-accent/16 shadow-[0_28px_60px_-40px_rgba(37,99,235,0.9)] transition-transform duration-300 ease-out"
              aria-hidden
            />
            {TABS.map((t, i) => {
              const meta = TAB_META[t];
              const isActive = t === tab;
              return (
                <a
                  key={t}
                  ref={(el) => (tabRefs.current[i] = el)}
                  href={`#/${t}`}
                  onClick={(e) => { e.preventDefault(); setTab(t); window.location.hash = `/${t}`; }}
                  className={[
                    "relative z-10 inline-flex min-w-[220px] items-center gap-4 rounded-3xl px-5 py-3 transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    isActive
                      ? "text-base-content"
                      : "text-base-content/60 hover:text-base-content/90",
                  ].join(" ")}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${t}`}
                >
                  <span
                    className={[
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors duration-200",
                      isActive
                        ? "bg-primary/15 text-primary shadow-sm shadow-primary/30"
                        : "bg-base-200/80 text-base-content/50",
                    ].join(" ")}
                  >
                    {meta.icon(isActive)}
                  </span>
                  <span className="flex flex-col text-left">
                    <span className="text-sm font-semibold tracking-tight">{meta.label}</span>
                    <span className="text-xs font-medium uppercase tracking-[0.25em] text-base-content/50">
                      {meta.description}
                    </span>
                  </span>
                </a>
              );
            })}
          </div>
        </nav>
      </div>
  );
}
