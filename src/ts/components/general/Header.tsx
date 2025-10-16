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
  Idle: "badge",
  Running: "badge badge-info",
  Parsing: "badge badge-warning",
  Ready: "badge badge-success",
  Error: "badge badge-error",
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

  return (
    <header
      className={[
        "sticky top-0 z-20 border-b border-base-300 bg-base-200/20 backdrop-blur transition-shadow",
        scrolled ? "shadow-lg" : "",
      ].join(" ")}
      role="banner"
    >
      <div className="mx-auto max-w-7xl px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* brand + repo */}
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="font-semibold tracking-tight">TCDR - </span>
              <div className="min-w-0 truncate">
                <span className="truncate font-medium">
                  {repoName || "No repo"}
                </span>
                <span className="mx-2 text-base-content/50">·</span>
                <span className="rounded bg-base-200 px-1.5 py-0.5 text-xs text-base-content/70">
                  {branch || "-"}
                </span>
              </div>
            </div>
            <div className="hidden sm:block">
              <StatusPill status={status} />
            </div>
          </div>

          {/* actions */}
          <div className="ml-auto flex items-center gap-2">
            <div className="sm:hidden">
              <StatusPill status={status} />
            </div>

            <ThemeToggle />

            <button
              type="button"
              className="btn btn-sm"
              onClick={onRunAll}
              title="Run all tests (R)"
              aria-label="Run all tests"
            >
              {/* play icon */}
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
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={onExport}
              title="Export as PDF (E)"
              aria-label="Export as PDF"
            >
              {/* pdf icon */}
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
