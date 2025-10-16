// ---- Atomic types ---------------------------------------------------------
export type Hotspot = {
  file: string;
  function?: string;
  reason: "complexity" | "low-cov" | "flaky" | "new-code" | "other";
  score: number;            // 0..100
  lines?: string;           // e.g. "42-44,67"
};

export type DashboardWire = {
  repoName: string;
  branch: string;
  status: "Idle" | "Running" | "Parsing" | "Ready" | "Error";
  totals: {
    lines: number;        // %
    branches: number;     // %
    methods?: number;     // %
    fullMethods?: number; // %
    counts?: {
      lines?: { covered: number; uncovered: number; coverable: number; total: number };
      branches?: { covered: number; total: number };
      methods?: { covered: number; fullCovered: number; total: number };
    };
  };
  commit: { sha: string; short: string; message: string; author: string; timestamp: string };
  diff: { base: string; coverage: number; filesChanged: number; failedThreshold: boolean };
  thresholds: { total: number; diff: number };
  summary?: {
    parser?: string; assemblies?: number; classes?: number; files?: number;
    generatedBy?: string; generatedAt?: string;
  };
  trend?: number[]; // line% history (0..100)
  topUncovered?: { path: string; lines: number[] }[];
  hotspots?: Hotspot[];
};

// ---- Overview shapes (single source of truth for totals) -------------------
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
  at: string;            // ISO
  linePct: number;       // 0..100
  branchPct: number;     // 0..100
  methodPct: number;     // 0..100
  fullMethodPct: number; // 0..100
};

// Hierarchical rows for Coverage table (assembly -> namespace -> class -> file)
export type CoverageRow = {
  name: string;
  kind: "assembly" | "namespace" | "class" | "file";
  path?: string;
  children?: CoverageRow[];
  lines:    { covered: number; uncovered: number; coverable: number; total: number; pct: number };
  branches: { covered: number; total: number; pct: number } | null;
  methods:  { covered: number; fullCovered: number; total: number; pct: number; fullPct: number } | null;
  delta?:   { linePct?: number; branchPct?: number; methodPct?: number; fullMethodPct?: number }; // for compare
};

export type OverviewProps = {
  summary: OverviewSummary;
  totals: OverviewTotals;
  history?: OverviewHistory[];
  hotspots?: Hotspot[];
  rows: CoverageRow[];   // top-level (assemblies)
  snapshots?: { id: string; label: string }[];
  onSelectSnapshot?: (id: string | null) => void;
};
