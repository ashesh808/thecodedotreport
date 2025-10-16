import Header from "@/components/general/Header";
import {useHashTab} from "@/components/general/TopNavBar";
import Placeholder from "@/components/general/Placeholder";
import Overview from "@/components/overview/Overview";
import Coverage from "@/components/coverage/Coverage";
import { DashboardWire } from "@/types";
import {toOverviewProps} from "@/mapper";


export default function Dashboard(props: DashboardWire) {
  const { repoName, branch, status } = props;
  const { summary, totals, history, hotspots } = toOverviewProps(props);
  const [tab] = useHashTab();

  return (
    <div className="relative min-h-[70vh]">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-base-200/60 via-transparent to-transparent" />

      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 btn btn-sm">
        Skip to main content
      </a>

      <Header
        repoName={repoName}
        branch={branch}
        status={status}
        onRunAll={() => {/* TODO */}}
        onExport={() => {/* TODO */}}
      />


      <main id="main" className="mx-auto max-w-7xl px-4 py-6 pb-24">
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
