import { toOverviewProps } from "@/mapper";
import type { DashboardWire } from "@/types";
import { buildCoverletSummary, type CoverletReport } from "./coverlet";
import type { DashboardContent } from "./types";

export function normalizeDashboardProps(
  props: DashboardWire | CoverletReport
): DashboardContent {
  if (isDashboardWire(props)) {
    const { summary, totals, history } = toOverviewProps(props);
    return {
      repoName: props.repoName,
      branch: props.branch,
      status: props.status,
      overview: { summary, totals, history },
      coverageRows: [],
      thresholds: { total: props.thresholds.total },
      allowRunAll: true,
    };
  }

  const report = props as CoverletReport;
  const { rows, overviewSummary, totals } = buildCoverletSummary(report);
  const assemblyNames = Object.keys(report);

  return {
    repoName: assemblyNames.length ? stripDllSuffix(assemblyNames[0]) : "Coverlet report",
    branch: undefined,
    status: "Ready",
    overview: {
      summary: overviewSummary,
      totals,
      history: undefined,
    },
    coverageRows: rows,
    thresholds: undefined,
    allowRunAll: true,
  };
}

function isDashboardWire(value: unknown): value is DashboardWire {
  return (
    !!value &&
    typeof value === "object" &&
    "totals" in value &&
    "thresholds" in value
  );
}

function stripDllSuffix(name: string): string {
  return name.endsWith(".dll") ? name.slice(0, -4) : name;
}
