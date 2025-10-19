import type { Status } from "@/components/general/Header";
import type {
  CoverageRow,
  Hotspot,
  OverviewHistory,
  OverviewSummary,
  OverviewTotals,
} from "@/types";

export type DashboardContent = {
  repoName?: string;
  branch?: string;
  status: Status;
  overview: {
    summary: OverviewSummary;
    totals: OverviewTotals;
    history?: OverviewHistory[];
    hotspots: Hotspot[];
  };
  coverageRows: CoverageRow[];
  thresholds?: { total?: number };
  allowRunAll: boolean;
};

export type RunResult = {
  state: "success" | "error";
  message: string;
  durationSeconds?: number;
  stdout?: string;
  stderr?: string;
};
