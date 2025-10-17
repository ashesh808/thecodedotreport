import React from "react";
import ThemeToggle from "@/components/general/ThemeToggle";
import {TopNavBar} from "@/components/general/TopNavBar";

export type Status = "Idle" | "Running" | "Parsing" | "Ready" | "Error";

export type HeaderProps = {
  repoName?: string;
  branch?: string;
  status: Status;
  onRunAll?: () => void;
  onExport?: () => void;
};

function useScrolled(offset = 4) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset]);
  return scrolled;
}

const STATUS_STYLES: Record<Status, string> = {
  Idle: "badge border bg-base-100/80 border-base-200/70",
  Running: "badge border border-info/40 bg-info/20 text-info-content",
  Parsing: "badge border border-warning/40 bg-warning/20 text-warning-content",
  Ready: "badge border border-success/40 bg-success/15 text-success-content",
  Error: "badge border border-error/40 bg-error/15 text-error-content",
};

const STATUS_DOT: Record<Status, string> = {
  Idle: "bg-base-content/40",
  Running: "bg-info animate-pulse",
  Parsing: "bg-warning animate-pulse",
  Ready: "bg-success",
  Error: "bg-error",
};

function StatusPill({ status }: { status: Status }) {
  return (
    <span className={`${STATUS_STYLES[status]} gap-1`}>
      <span
        aria-hidden
        className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[status]}`}
      />
      {status}
    </span>
  );
}

export default function Header({
  repoName,
  branch,
  status,
  onRunAll,
  onExport,
}: HeaderProps) {
  const scrolled = useScrolled();
  const isRunning = status === "Running";

  return (
    <header
      className={[
        "sticky top-0 z-30 border-b border-base-300/60 bg-base-100/70 backdrop-blur-xl transition-all",
        scrolled ? "shadow-lg shadow-primary/10" : "",
      ].join(" ")}
      role="banner"
    >
      <div className="dash-section py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* brand + repo */}
          <div className="flex w-full items-center gap-3 md:w-auto">
            <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/50 bg-primary/15 text-primary shadow-elevated">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden
                className="opacity-90"
              >
                <path
                  fill="currentColor"
                  d="M12 2l9 4v6c0 5.1-3.4 10.2-9 12c-5.6-1.8-9-6.9-9-12V6z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm uppercase tracking-[0.2em] text-base-content/60">
                  The Code Dot Report
                </span>
                <span className="hidden h-6 w-px bg-base-content/20 md:block" aria-hidden />
                <StatusPill status={status} />
              </div>
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-base-content">
                <span className="truncate text-lg font-semibold tracking-tight">
                  {repoName || "No repository selected"}
                </span>
                <span className="text-base-content/40">/</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-base-content/10 bg-base-200/70 px-2 py-0.5 text-xs font-medium text-base-content/70">
                  <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
                    <path fill="currentColor" d="M4 4h7l1 2h8v12H4z" />
                  </svg>
                  {branch || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />

            <button
              type="button"
              className={[
                "btn btn-sm btn-primary shadow-sm shadow-primary/20 transition-all",
                isRunning ? "btn-disabled cursor-progress opacity-80" : "",
              ].join(" ")}
              onClick={() => !isRunning && onRunAll?.()}
              title="Run all tests (R)"
              aria-label="Run all tests"
              disabled={isRunning}
              aria-busy={isRunning}
            >
              {isRunning ? (
                <>
                  <svg
                    className="-ml-0.5 mr-2 inline-block h-3.5 w-3.5 animate-spin"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-20"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-90"
                      fill="currentColor"
                      d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 1 0-6-6z"
                    />
                  </svg>
                  Running…
                </>
              ) : (
                <>
                  <svg
                    className="-ml-0.5 mr-1 inline-block"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path fill="currentColor" d="M8 5v14l11-7z" />
                  </svg>
                  Run All
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-sm btn-ghost border border-base-200/70 bg-base-100/70"
              onClick={onExport}
              title="Export as PDF (E)"
              aria-label="Export as PDF"
            >
              <svg
                className="-ml-0.5 mr-1 inline-block"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 0l6 6"
                />
              </svg>
              Export PDF
            </button>
          </div>
        </div>
      </div>
      <TopNavBar />
    </header>
  );
}
