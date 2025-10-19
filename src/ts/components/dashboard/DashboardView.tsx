import React from "react";
import Header from "@/components/general/Header";
import { useHashTab } from "@/components/general/TopNavBar";
import Overview from "@/components/overview/Overview";
import Coverage from "@/components/coverage/Coverage";
import type { DashboardWire } from "@/types";
import { postRunAll } from "@/dashboard/api";
import { normalizeDashboardProps } from "@/dashboard/normalize";
import type { CoverletReport } from "@/dashboard/coverlet";
import type { RunAllResponse, RunResult } from "@/dashboard/types";
import RunResultBanner from "./RunResultBanner";

export default function Dashboard(rawProps: DashboardWire | CoverletReport) {
  const { repoName, branch, status, overview, coverageRows, thresholds, allowRunAll } =
    React.useMemo(() => normalizeDashboardProps(rawProps), [rawProps]);
  const { summary, totals, history } = overview;
  const [tab] = useHashTab();
  const [currentStatus, setCurrentStatus] = React.useState(status);
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

    let payload: RunAllResponse | null = null;
    let duration: number | undefined;
    try {
      const { response, payload: body } = await postRunAll();
      payload = body;

      duration =
        typeof payload?.duration_seconds === "number"
          ? payload.duration_seconds
          : undefined;

      if (!payload || payload.ok !== true || !response.ok) {
        const exit = payload && "exit_code" in payload ? payload.exit_code : undefined;
        const errMessage =
          (payload && "error" in payload && typeof payload.error === "string" && payload.error) ||
          (typeof exit === "number"
            ? `dotnet test failed (exit code ${exit}).`
            : "dotnet test failed.");
        throw new Error(errMessage);
      }

      setCurrentStatus("Ready");
      setRunResult({
        state: "success",
        message:
          duration != null
            ? `All tests passed in ${duration.toFixed(2)}s.`
            : "All tests passed.",
        durationSeconds: duration,
        stdout: payload.stdout,
        stderr: payload.stderr,
      });
    } catch (error) {
      const message =
        (payload && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : undefined) ??
        (error instanceof Error ? error.message : "Failed to run dotnet tests.");

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

  const handleExport = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.print();
    }
  }, []);

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
        onRunAll={allowRunAll ? handleRunAll : undefined}
        onExport={handleExport}
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
            totals={totals}
            history={history}
          />
        )}
        {tab === "coverage" && (
          <Coverage
            rows={coverageRows}
            thresholds={thresholds}
            pageSize={50}
          />
        )}
      </main>
    </div>
  );
}
