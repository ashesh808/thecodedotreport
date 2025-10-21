/*
=========================================================================
   Dashboard
=========================================================================
*/

export type DashboardWire = {
  repoName: string;
  branch: string;
  status: "Idle" | "Running" | "Parsing" | "Ready" | "Error";
  totals: {
    lines: number;
    branches: number;
    methods?: number;
    fullMethods?: number;
    counts?: {
      lines?: { covered: number; uncovered: number; coverable: number; total: number };
      branches?: { covered: number; total: number };
      methods?: { covered: number; fullCovered: number; total: number };
    };
  };
  commit: { sha: string; short: string; message: string; author: string; timestamp: string };
  thresholds: { total: number; diff: number };
  summary?: {
    parser?: string; assemblies?: number; classes?: number; files?: number;
    generatedBy?: string; generatedAt?: string;
  };
  trend?: number[];
};

/*
=========================================================================
   Overview
=========================================================================
*/

export type OverviewTotals = {
  lines:    { covered?: number; uncovered?: number; coverable?: number; total?: number; pct: number };
  branches: { covered?: number; total?: number; pct: number };
  methods:  { covered?: number; fullCovered?: number; total?: number; pct: number; fullPct: number };
};

export type OverviewSummary = {
  parser?: string; assemblies?: number; classes?: number; files?: number;
  generatedAt?: string; generatedBy?: string;
};

export type OverviewHistory = {
  at: string;
  linePct: number;
  branchPct: number;
  methodPct: number;
  fullMethodPct: number;
};


/*
=========================================================================
   Coverage
=========================================================================
*/

export type CoverageRow = {
  name: string;
  kind: "assembly" | "namespace" | "class" | "file" | "method";
  path?: string;
  children?: CoverageRow[];
  lines:    { covered: number; uncovered: number; coverable: number; total: number; pct: number };
  branches: { covered: number; total: number; pct: number } | null;
  methods:  { covered: number; fullCovered: number; total: number; pct: number; fullPct: number } | null;
  delta?:   { linePct?: number; branchPct?: number; methodPct?: number; fullMethodPct?: number };
};

export type CoverageProps = {
  rows: CoverageRow[];
  snapshots?: { id: string; label: string }[];
  onSelectSnapshot?: (id: string | null) => void;
  thresholds?: { total?: number };
  pageSize?: number;
};
