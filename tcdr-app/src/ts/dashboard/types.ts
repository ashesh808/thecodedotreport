import type { Status } from "@/components/general/Header";
import type {
  CoverageRow,
  OverviewHistory,
  OverviewSummary,
  OverviewTotals,
} from "@/types";

export type DashboardOverview = {
  summary: OverviewSummary;
  totals: OverviewTotals;
  history?: OverviewHistory[];
};

export type DashboardContent = {
  repoName?: string;
  branch?: string;
  status: Status;
  overview: DashboardOverview;
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

export type RunAllSuccessResponse = {
  ok: true;
  exit_code: number;
  duration_seconds: number;
  stdout: string;
  stderr: string;
};

export type RunAllFailureResponse = {
  ok: false;
  error: string;
  timeout?: boolean;
  duration_seconds?: number;
  stdout?: string;
  stderr?: string;
};

export type RunAllResponse = RunAllSuccessResponse | RunAllFailureResponse;
