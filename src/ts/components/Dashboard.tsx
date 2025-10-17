import React from "react";
import Header from "@/components/general/Header";
import {useHashTab} from "@/components/general/TopNavBar";
import Overview from "@/components/overview/Overview";
import Coverage from "@/components/coverage/Coverage";
import { DashboardWire } from "@/types";
import {toOverviewProps} from "@/mapper";

type RunResult = {
  state: "success" | "error";
  message: string;
  durationSeconds?: number;
  stdout?: string;
  stderr?: string;
};


export default function Dashboard(props: DashboardWire) {
  const { repoName, branch, status } = props;
  const { summary, totals, history, hotspots } = toOverviewProps(props);
  const [tab] = useHashTab();
  const [currentStatus, setCurrentStatus] = React.useState<DashboardWire["status"]>(status);
  const [isRunning, setIsRunning] = React.useState(false);
  const [runResult, setRunResult] = React.useState<RunResult | null>(null);

  React.useEffect(() => {
    if (!isRunning) {
      setCurrentStatus(status);
    }
  }, [status, isRunning]);

  const handleRunAll = React.useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setCurrentStatus("Running");
    setRunResult(null);

    let payload: any = null;
    let duration: number | undefined;
    try {
      const response = await fetch("/api/tests/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      duration =
        typeof payload?.duration_seconds === "number"
          ? payload.duration_seconds
          : undefined;

      if (!response.ok || !payload?.ok) {
        const exit = payload?.exit_code;
        const errorMessage =
          payload?.error ||
          (typeof exit === "number"
            ? `dotnet test failed (exit code ${exit}).`
            : "dotnet test failed.");
        throw new Error(errorMessage);
      }

      setCurrentStatus("Ready");
      setRunResult({
        state: "success",
        message: duration != null
          ? `All tests passed in ${duration.toFixed(2)}s.`
          : "All tests passed.",
        durationSeconds: duration,
        stdout: payload?.stdout,
        stderr: payload?.stderr,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to run dotnet tests.";
      setCurrentStatus("Error");
      setRunResult({
        state: "error",
        message,
        durationSeconds: duration,
        stdout: payload?.stdout,
        stderr: payload?.stderr,
      });
    } finally {
      setIsRunning(false);
    }
  }, [isRunning]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-base-200/50 via-base-100/60 to-base-100" />
        <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-32 top-32 h-96 w-96 rounded-full bg-accent/10 blur-[200px]" />
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full border border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent blur-[160px]" />
      </div>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 btn btn-sm">
        Skip to main content
      </a>

      <Header
        repoName={repoName}
        branch={branch}
        status={currentStatus}
        onRunAll={handleRunAll}
        onExport={() => {/* TODO */}}
      />

      {runResult && (
        <div className="dash-section relative z-20 pt-4">
          <RunResultBanner result={runResult} onDismiss={() => setRunResult(null)} />
        </div>
      )}

      <main
        id="main"
        className="dash-section relative z-10 py-10 pb-28"
      >
        {tab === "overview" && (
          <Overview
            summary={summary}
            totals={totals as any}
            history={history}
            hotspots={hotspots}
            rows={[]}
          />
        )}
        {tab === "coverage" && (
          <Coverage
            rows={[]}
            thresholds={{ total: props.thresholds.total }}
            pageSize={50}
          />
        )}
      </main>
    </div>
  );
}

function RunResultBanner({
  result,
  onDismiss,
}: {
  result: RunResult;
  onDismiss: () => void;
}) {
  const isSuccess = result.state === "success";
  const toneClasses = isSuccess
    ? "border-success/50 bg-success/10 text-success"
    : "border-error/50 bg-error/10 text-error";
  const title = isSuccess ? "Tests passed" : "Tests failed";
  return (
    <div
      className={[
        "rounded-3xl border px-6 py-5 shadow-lg shadow-primary/5 backdrop-blur",
        toneClasses,
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start gap-4">
        <span
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-lg font-semibold",
            isSuccess ? "border-success/60 bg-success/10" : "border-error/60 bg-error/10",
          ].join(" ")}
          aria-hidden
        >
          {isSuccess ? (
            <svg width="18" height="18" viewBox="0 0 24 24" className="text-success">
              <path
                fill="currentColor"
                d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1 14l-4-4l1.41-1.41L11 13.17l5.59-5.58L18 9z"
              />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" className="text-error">
              <path
                fill="currentColor"
                d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 13h-2v-2h2Zm0-4h-2V7h2Z"
              />
            </svg>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-base-content/60">
            {title}
          </p>
          <p className="mt-1 text-base font-medium text-base-content">{result.message}</p>
          {result.durationSeconds != null && (
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.3em] text-base-content/50">
              Duration: {result.durationSeconds.toFixed(2)}s
            </p>
          )}
          {(result.stdout || result.stderr) && (
            <details className="mt-4 rounded-2xl border border-base-content/10 bg-base-100/80 p-3">
              <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-[0.3em] text-base-content/60">
                View log output
              </summary>
              <div className="mt-3 space-y-3 text-xs text-base-content/80">
                {result.stdout && (
                  <div>
                    <p className="mb-1 font-semibold uppercase tracking-[0.25em] text-base-content/50">
                      stdout
                    </p>
                    <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-base-200/60 p-3 text-[11px] leading-relaxed">
                      {result.stdout}
                    </pre>
                  </div>
                )}
                {result.stderr && (
                  <div>
                    <p className="mb-1 font-semibold uppercase tracking-[0.25em] text-base-content/50">
                      stderr
                    </p>
                    <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-base-200/60 p-3 text-[11px] leading-relaxed text-error">
                      {result.stderr}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
        <button
          type="button"
          className="btn btn-xs btn-ghost border border-transparent text-base-content/60 hover:border-base-content/20"
          onClick={onDismiss}
          aria-label="Dismiss test results"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              d="M18.3 5.71L12 12l6.3 6.29l-1.41 1.42L10.59 13.4l-6.3 6.3L2.88 18.3l6.3-6.29l-6.3-6.3L4.3 4.29l6.29 6.3l6.3-6.3z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
