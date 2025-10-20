import type { CoverageRow, OverviewSummary, OverviewTotals } from "@/types";

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

export type MetricsAccumulator = {
  lineCovered: number;
  lineUncovered: number;
  lineTotal: number;
  branchCovered: number;
  branchTotal: number;
  methodCovered: number;
  methodFullCovered: number;
  methodTotal: number;
};

export type CoverletSummary = {
  rows: CoverageRow[];
  counts: {
    assemblies: number;
    classes: number;
    files: number;
  };
  metrics: MetricsAccumulator;
};

export function summarizeCoverletReport(report: CoverletReport): CoverletSummary {
  const assemblies: CoverageRow[] = [];
  let overallMetrics = emptyMetrics();
  let assemblyCount = 0;
  let fileCount = 0;
  let classCount = 0;

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

  return {
    rows: assemblies,
    counts: {
      assemblies: assemblyCount,
      classes: classCount,
      files: fileCount,
    },
    metrics: overallMetrics,
  };
}

export function metricsToOverviewTotals(metrics: MetricsAccumulator): OverviewTotals {
  const coverable = metrics.lineCovered + metrics.lineUncovered;
  const linePct = coverable > 0 ? (metrics.lineCovered / coverable) * 100 : Number.NaN;
  const branchPct =
    metrics.branchTotal > 0 ? (metrics.branchCovered / metrics.branchTotal) * 100 : Number.NaN;
  const methodPct =
    metrics.methodTotal > 0 ? (metrics.methodCovered / metrics.methodTotal) * 100 : Number.NaN;
  const fullMethodPct =
    metrics.methodTotal > 0
      ? (metrics.methodFullCovered / metrics.methodTotal) * 100
      : Number.NaN;

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

export function buildCoverletSummary(report: CoverletReport): {
  rows: CoverageRow[];
  overviewSummary: OverviewSummary;
  totals: OverviewTotals;
} {
  const { rows, counts, metrics } = summarizeCoverletReport(report);
  const totals = metricsToOverviewTotals(metrics);
  const overviewSummary: OverviewSummary = {
    parser: "coverlet",
    assemblies: counts.assemblies,
    classes: counts.classes,
    files: counts.files,
  };
  return { rows, overviewSummary, totals };
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

  if (coverable === 0 && totalBranches === 0) {
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
    counts.methodTotal > 0
      ? (counts.methodFullCovered / counts.methodTotal) * 100
      : Number.NaN;

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

function formatLineRange(method: CoverletMethod | undefined): string | undefined {
  if (!method?.Lines) return undefined;
  const numbers = Object.keys(method.Lines)
    .map((line) => Number(line))
    .filter((line) => !Number.isNaN(line))
    .sort((a, b) => a - b);
  if (!numbers.length) return undefined;
  const [first, last] = [numbers[0], numbers[numbers.length - 1]];
  return first === last ? `Line ${first}` : `Lines ${first}-${last}`;
}
