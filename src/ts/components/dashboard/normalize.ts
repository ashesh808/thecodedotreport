import { toOverviewProps } from "@/mapper";
import type { Hotspot, CoverageRow, DashboardWire, OverviewSummary } from "@/types";
import type { DashboardContent } from "./types";

type CoverletBranch = {
  Line?: number;
  Offset?: number;
  EndOffset?: number;
  Path?: number;
  Ordinal?: number;
  Hits?: number;
};

type CoverletMethod = {
  Lines?: Record<string, number>;
  Branches?: CoverletBranch[];
};

type CoverletClass = Record<string, CoverletMethod>;
type CoverletFile = Record<string, CoverletClass>;
type CoverletAssembly = Record<string, CoverletFile>;
export type CoverletReport = Record<string, CoverletAssembly>;

type MetricsAccumulator = {
  lineCovered: number;
  lineUncovered: number;
  lineTotal: number;
  branchCovered: number;
  branchTotal: number;
  methodCovered: number;
  methodFullCovered: number;
  methodTotal: number;
};

export function normalizeDashboardProps(
  props: DashboardWire | CoverletReport
): DashboardContent {
  if (isDashboardWire(props)) {
    const { summary, totals, history, hotspots } = toOverviewProps(props);
    return {
      repoName: props.repoName,
      branch: props.branch,
      status: props.status,
      overview: { summary, totals, history, hotspots },
      coverageRows: [],
      thresholds: { total: props.thresholds.total },
      allowRunAll: true,
    };
  }

  const report = props as CoverletReport;
  const assemblies: CoverageRow[] = [];
  const assemblyNames = Object.keys(report);
  let overallMetrics = emptyMetrics();
  let assemblyCount = 0;
  let fileCount = 0;
  let classCount = 0;
  const hotspotCandidates: Hotspot[] = [];

  for (const [assemblyName, files] of Object.entries(report)) {
    if (!files || typeof files !== "object") continue;
    assemblyCount += 1;
    let assemblyMetrics = emptyMetrics();
    const assemblyChildren: CoverageRow[] = [];

    for (const [filePath, classes] of Object.entries(files)) {
      if (!classes || typeof classes !== "object") continue;
      fileCount += 1;
      let fileMetrics = emptyMetrics();
      const classChildren: CoverageRow[] = [];

      for (const [className, methods] of Object.entries(classes)) {
        if (!methods || typeof methods !== "object") continue;
        classCount += 1;
        let classMetrics = emptyMetrics();
        const methodRows: CoverageRow[] = [];

        for (const [methodName, methodData] of Object.entries(methods)) {
          const methodMetrics = summarizeMethod(methodData);
          if (!hasCoverage(methodMetrics)) continue;

          const coveragePct = coveragePercentage(methodMetrics);
          if (coveragePct < 100) {
            const uncoveredLines = collectUncoveredLines(methodData);
            hotspotCandidates.push({
              file: filePath,
              function: simplifyMethodName(methodName),
              reason: "low-cov",
              score: Math.max(0, Math.min(100, 100 - coveragePct)),
              lines: uncoveredLines.length ? uncoveredLines.join(", ") : undefined,
            });
          }

          methodRows.push(
            createRow({
              name: simplifyMethodName(methodName),
              kind: "method",
              counts: methodMetrics,
              path: formatLineRange(methodData),
            })
          );

          classMetrics = addMetrics(classMetrics, methodMetrics);
        }

        if (!hasCoverage(classMetrics)) continue;

        classChildren.push(
          createRow({
            name: simplifyClassName(className),
            kind: "class",
            counts: classMetrics,
            path: provideClassPath(className),
            children: methodRows,
          })
        );
        fileMetrics = addMetrics(fileMetrics, classMetrics);
      }

      if (!hasCoverage(fileMetrics)) continue;

      assemblyChildren.push(
        createRow({
          name: extractFileName(filePath),
          kind: "file",
          counts: fileMetrics,
          path: filePath,
          children: classChildren,
        })
      );
      assemblyMetrics = addMetrics(assemblyMetrics, fileMetrics);
    }

    if (!hasCoverage(assemblyMetrics)) continue;

    assemblies.push(
      createRow({
        name: assemblyName,
        kind: "assembly",
        counts: assemblyMetrics,
        children: assemblyChildren,
      })
    );
    overallMetrics = addMetrics(overallMetrics, assemblyMetrics);
  }

  const totals = toOverviewTotals(overallMetrics);
  const summary: OverviewSummary = {
    parser: "coverlet",
    assemblies: assemblyCount,
    classes: classCount,
    files: fileCount,
  };

  return {
    repoName: assemblyNames.length ? stripDllSuffix(assemblyNames[0]) : "Coverlet report",
    branch: undefined,
    status: "Ready",
    overview: {
      summary,
      totals,
      history: undefined,
      hotspots: selectHotspots(hotspotCandidates),
    },
    coverageRows: assemblies,
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

function emptyMetrics(): MetricsAccumulator {
  return {
    lineCovered: 0,
    lineUncovered: 0,
    lineTotal: 0,
    branchCovered: 0,
    branchTotal: 0,
    methodCovered: 0,
    methodFullCovered: 0,
    methodTotal: 0,
  };
}

function hasCoverage(metrics: MetricsAccumulator): boolean {
  return (
    metrics.lineCovered > 0 ||
    metrics.lineUncovered > 0 ||
    metrics.branchTotal > 0 ||
    metrics.methodTotal > 0
  );
}

function addMetrics(a: MetricsAccumulator, b: MetricsAccumulator): MetricsAccumulator {
  return {
    lineCovered: a.lineCovered + b.lineCovered,
    lineUncovered: a.lineUncovered + b.lineUncovered,
    lineTotal: a.lineTotal + b.lineTotal,
    branchCovered: a.branchCovered + b.branchCovered,
    branchTotal: a.branchTotal + b.branchTotal,
    methodCovered: a.methodCovered + b.methodCovered,
    methodFullCovered: a.methodFullCovered + b.methodFullCovered,
    methodTotal: a.methodTotal + b.methodTotal,
  };
}

function summarizeMethod(method: CoverletMethod | undefined): MetricsAccumulator {
  const metrics = emptyMetrics();
  if (!method || typeof method !== "object") {
    return metrics;
  }

  const lineValues = Object.values(method.Lines ?? {});
  const coveredLines = lineValues.filter((hits) => hits > 0).length;
  const uncoveredLines = lineValues.filter((hits) => hits === 0).length;
  const coverable = coveredLines + uncoveredLines;

  const branchValues = method.Branches ?? [];
  const coveredBranches = branchValues.filter((b) => (b?.Hits ?? 0) > 0).length;
  const totalBranches = branchValues.length;

  const hasData = coverable > 0 || totalBranches > 0;
  if (!hasData) {
    return metrics;
  }

  metrics.lineCovered = coveredLines;
  metrics.lineUncovered = uncoveredLines;
  metrics.lineTotal = coverable;
  metrics.branchCovered = coveredBranches;
  metrics.branchTotal = totalBranches;

  metrics.methodTotal = 1;
  const methodCovered = coverable > 0 ? coveredLines > 0 : coveredBranches > 0;
  const methodFull = coverable > 0 ? uncoveredLines === 0 : coveredBranches === totalBranches;
  metrics.methodCovered = methodCovered ? 1 : 0;
  metrics.methodFullCovered = methodFull ? 1 : 0;

  return metrics;
}

function toOverviewTotals(metrics: MetricsAccumulator): DashboardContent["overview"]["totals"] {
  const coverable = metrics.lineCovered + metrics.lineUncovered;
  const linePct = coverable > 0 ? (metrics.lineCovered / coverable) * 100 : Number.NaN;
  const branchPct =
    metrics.branchTotal > 0 ? (metrics.branchCovered / metrics.branchTotal) * 100 : Number.NaN;
  const methodPct =
    metrics.methodTotal > 0 ? (metrics.methodCovered / metrics.methodTotal) * 100 : Number.NaN;
  const fullMethodPct =
    metrics.methodTotal > 0 ? (metrics.methodFullCovered / metrics.methodTotal) * 100 : Number.NaN;

  return {
    lines: {
      pct: linePct,
      covered: metrics.lineCovered,
      uncovered: metrics.lineUncovered,
      coverable,
      total: metrics.lineTotal || coverable,
    },
    branches: {
      pct: branchPct,
      covered: metrics.branchCovered,
      total: metrics.branchTotal,
    },
    methods: {
      pct: methodPct,
      fullPct: fullMethodPct,
      covered: metrics.methodCovered,
      fullCovered: metrics.methodFullCovered,
      total: metrics.methodTotal,
    },
  };
}

function createRow({
  name,
  kind,
  counts,
  path,
  children,
}: {
  name: string;
  kind: CoverageRow["kind"];
  counts: MetricsAccumulator;
  path?: string;
  children?: CoverageRow[];
}): CoverageRow {
  const coverable = counts.lineCovered + counts.lineUncovered;
  const totalLines = counts.lineTotal || coverable;
  const linePct = coverable > 0 ? (counts.lineCovered / coverable) * 100 : Number.NaN;
  const branchPct =
    counts.branchTotal > 0 ? (counts.branchCovered / counts.branchTotal) * 100 : Number.NaN;
  const methodPct =
    counts.methodTotal > 0 ? (counts.methodCovered / counts.methodTotal) * 100 : Number.NaN;
  const fullMethodPct =
    counts.methodTotal > 0 ? (counts.methodFullCovered / counts.methodTotal) * 100 : Number.NaN;

  return {
    name,
    kind,
    path,
    children,
    lines: {
      covered: counts.lineCovered,
      uncovered: counts.lineUncovered,
      coverable,
      total: totalLines,
      pct: linePct,
    },
    branches: {
      covered: counts.branchCovered,
      total: counts.branchTotal,
      pct: branchPct,
    },
    methods: {
      covered: counts.methodCovered,
      fullCovered: counts.methodFullCovered,
      total: counts.methodTotal,
      pct: methodPct,
      fullPct: fullMethodPct,
    },
  };
}

function extractFileName(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

function simplifyClassName(className: string): string {
  const parts = className.split(".");
  return parts[parts.length - 1] || className;
}

function provideClassPath(className: string): string | undefined {
  const parts = className.split(".");
  if (parts.length <= 1) return undefined;
  parts.pop();
  return parts.join(".");
}

function simplifyMethodName(methodName: string): string {
  const parts = methodName.split("::");
  const namePart = parts[parts.length - 1] || methodName;
  return namePart.replace(/^System\./, "");
}

function collectUncoveredLines(method: CoverletMethod | undefined): string[] {
  if (!method?.Lines) return [];
  return Object.entries(method.Lines)
    .filter(([, hits]) => hits === 0)
    .map(([line]) => line)
    .sort((a, b) => Number(a) - Number(b));
}

function formatLineRange(method: CoverletMethod | undefined): string | undefined {
  if (!method?.Lines) return undefined;
  const numbers = Object.keys(method.Lines)
    .map((l) => Number(l))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  if (!numbers.length) return undefined;
  const first = numbers[0];
  const last = numbers[numbers.length - 1];
  if (first === last) return `Line ${first}`;
  return `Lines ${first}-${last}`;
}

function coveragePercentage(metrics: MetricsAccumulator): number {
  const coverable = metrics.lineCovered + metrics.lineUncovered;
  if (coverable > 0) {
    return (metrics.lineCovered / coverable) * 100;
  }
  if (metrics.branchTotal > 0) {
    return (metrics.branchCovered / metrics.branchTotal) * 100;
  }
  return metrics.methodTotal > 0 ? (metrics.methodCovered / metrics.methodTotal) * 100 : 0;
}

function selectHotspots(hotspots: Hotspot[]): Hotspot[] {
  return hotspots
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

function stripDllSuffix(name: string): string {
  return name.endsWith(".dll") ? name.slice(0, -4) : name;
}
