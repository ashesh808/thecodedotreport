import type { DashboardWire, OverviewTotals, OverviewSummary, OverviewHistory } from "@/types";

type OverviewCore = {
  summary: OverviewSummary;
  totals: OverviewTotals;
  history?: OverviewHistory[];
};

export function toOverviewProps(d: DashboardWire): OverviewCore {
  const counts = d.totals.counts ?? {};

  const totals: OverviewTotals = {
    lines: {
      pct: d.totals.lines,
      covered: counts.lines?.covered,
      uncovered: counts.lines?.uncovered,
      coverable: counts.lines?.coverable,
      total: counts.lines?.total,
    },
    branches: {
      pct: d.totals.branches,
      covered: counts.branches?.covered,
      total: counts.branches?.total,
    },
    methods: {
      pct: d.totals.methods ?? Number.NaN,
      fullPct: d.totals.fullMethods ?? Number.NaN,
      covered: counts.methods?.covered,
      fullCovered: counts.methods?.fullCovered,
      total: counts.methods?.total,
    },
  };

  const summary: OverviewSummary = {
    parser: d.summary?.parser,
    assemblies: d.summary?.assemblies,
    classes: d.summary?.classes,
    files: d.summary?.files,
    generatedAt: d.summary?.generatedAt,
    generatedBy: d.summary?.generatedBy,
  };

  const now = d.summary?.generatedAt ?? d.commit?.timestamp ?? new Date().toISOString();
  const trend = d.trend ?? [];
  const history: OverviewHistory[] | undefined = trend.length
    ? trend.map((linePct, i) => ({
        at: i === trend.length - 1 ? now : new Date(Date.parse(now) - (trend.length - 1 - i) * 60_000).toISOString(),
        linePct,
        branchPct: d.totals.branches,
        methodPct: d.totals.methods ?? Number.NaN,
        fullMethodPct: d.totals.fullMethods ?? Number.NaN,
      }))
    : undefined;

  return { summary, totals, history };
}
