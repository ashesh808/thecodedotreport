import React from "react";
import type { CoverageRow } from "@/types";

/* =========================================================================
   Props
   ========================================================================= */

export type CoverageProps = {
  rows: CoverageRow[];                                 // top-level assemblies
  snapshots?: { id: string; label: string }[];
  onSelectSnapshot?: (id: string | null) => void;      // host recomputes row.delta if desired
  thresholds?: { total?: number };                     // highlight rows below line% threshold
  pageSize?: number;                                   // default 50
};

/* =========================================================================
   Coverage Page (root)
   ========================================================================= */

export default function Coverage({
  rows,
  snapshots,
  onSelectSnapshot,
  thresholds,
  pageSize = 50,
}: CoverageProps) {
  const [query, setQuery] = React.useState("");
  const [showLine, setShowLine] = React.useState(true);
  const [showBranch, setShowBranch] = React.useState(true);
  const [showMethod, setShowMethod] = React.useState(true);
  const [showFullMethod, setShowFullMethod] = React.useState(true);
  const [groupBy, setGroupBy] = React.useState<"assembly" | "namespace" | "class">("assembly"); // reserved
  const [expandedAllKey, setExpandedAllKey] = React.useState<"expand" | "collapse" | null>(null);
  const [compareId, setCompareId] = React.useState<string | null>(null);

  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(1);

  const onExpandAll = () => setExpandedAllKey("expand");
  const onCollapseAll = () => setExpandedAllKey("collapse");

  const handleCompare = (id: string) => {
    const next = id || null;
    setCompareId(next);
    onSelectSnapshot?.(next);
  };

  const visibleTree = React.useMemo(() => {
    // filter by name or path; keep parents if any child matches
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    const match = (r: CoverageRow) =>
      r.name.toLowerCase().includes(q) || (r.path?.toLowerCase().includes(q) ?? false);
    const walk = (nodes: CoverageRow[]): CoverageRow[] =>
      nodes
        .map((n) => {
          const kids = n.children ? walk(n.children) : undefined;
          return match(n) || (kids && kids.length) ? { ...n, children: kids } : null;
        })
        .filter(Boolean) as CoverageRow[];
    return walk(rows);
  }, [rows, query]);

  const flatVisible = React.useMemo(
    () => flatten(visibleTree),
    [visibleTree]
  );

  // Sorting only affects the *flat export & pagination presentation order* for now.
  const sortedFlat = React.useMemo(() => {
    const arr = [...flatVisible];
    arr.sort((a, b) => cmpRow(a.row, b.row, sortKey, sortDir));
    return arr;
  }, [flatVisible, sortKey, sortDir]);

  // Pagination over the flattened view (tree still renders hierarchically)
  const totalPages = Math.max(1, Math.ceil(sortedFlat.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const start = (pageClamped - 1) * pageSize;
  const pageKeys = new Set(sortedFlat.slice(start, start + pageSize).map((n) => rowKey(n.row)));
  const totalVisible = flatVisible.length;
  const showingCount = Math.max(0, Math.min(pageSize, totalVisible - start));
  const sortLabel = friendlySortLabel(sortKey);

  React.useEffect(() => { setPage(1); }, [query, sortKey, sortDir, pageSize]);

  const exportCSV = () => {
    const rowsForCsv = flatten(visibleTree).map(({ row, depth }) => toCsvRecord(row, depth));
    const header = Object.keys(rowsForCsv[0] ?? {
      depth: 0, kind: "", name: "", path: "",
      coveredLines: 0, uncoveredLines: 0, coverableLines: 0, totalLines: 0, linePct: 0,
      coveredBranches: "", totalBranches: "", branchPct: "",
      coveredMethods: "", totalMethods: "", methodPct: "", fullCoveredMethods: "", fullMethodPct: "",
    });
    const csv = [header.join(","), ...rowsForCsv.map((r) => header.map((h) => csvEscape(r[h as keyof typeof r])).join(","))].join("\n");
    downloadBlob(csv, "coverage.csv", "text/csv;charset=utf-8");
  };

  return (
    <section className="space-y-6">
      <div className="card glass-surface shadow-primary/5">
        <div className="card-body gap-5 py-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Coverage controls</h3>
              <p className="text-sm text-base-content/60">
                Toggle metrics, adjust grouping, and compare snapshots without losing context.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn btn-sm btn-ghost border border-base-200/60 bg-base-100/70" onClick={onExpandAll}>
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden className="-ml-0.5 mr-1 opacity-70">
                  <path fill="currentColor" d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Expand all
              </button>
              <button className="btn btn-sm btn-ghost border border-base-200/60 bg-base-100/70" onClick={onCollapseAll}>
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden className="-ml-0.5 mr-1 opacity-70">
                  <path fill="currentColor" d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Collapse all
              </button>
              <button className="btn btn-sm btn-outline border-primary/40 text-primary hover:bg-primary/10" onClick={exportCSV}>
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden className="-ml-0.5 mr-1 opacity-70">
                  <path fill="currentColor" d="M5 20h14v-2H5m14-7h-4V4H9v7H5l7 7z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <fieldset
              aria-label="Coverage types"
              className="flex flex-wrap items-center gap-2 rounded-2xl border border-base-content/10 bg-base-100/70 p-3"
            >
              <CheckToggle label="Line" checked={showLine} onChange={() => setShowLine(!showLine)} />
              <CheckToggle label="Branch" checked={showBranch} onChange={() => setShowBranch(!showBranch)} />
              <CheckToggle label="Method" checked={showMethod} onChange={() => setShowMethod(!showMethod)} />
              <CheckToggle
                label="Full method"
                checked={showFullMethod}
                onChange={() => setShowFullMethod(!showFullMethod)}
              />
            </fieldset>
            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 lg:w-auto">
              <SelectField
                label="Grouping"
                value={groupBy}
                onChange={(v) => setGroupBy(v as any)}
                options={[
                  { value: "assembly", label: "Assembly" },
                  { value: "namespace", label: "Namespace" },
                  { value: "class", label: "Class" },
                ]}
                className="sm:w-44"
              />

              <SelectField
                label="Compare with"
                value={compareId ?? ""}
                onChange={(v) => handleCompare(v)}
                options={[
                  { value: "", label: "— None —" },
                  ...(snapshots?.map((s) => ({ value: s.id, label: s.label })) ?? []),
                ]}
                className="sm:w-60"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card glass-surface shadow-primary/5">
        <div className="card-body gap-5 py-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <SearchField
              placeholder="Filter by name or path…"
              value={query}
              onChange={setQuery}
              className="w-full md:max-w-sm"
            />
            <div className="flex flex-wrap items-center gap-3 text-sm text-base-content/60">
              <span>
                Showing {showingCount} of {totalVisible} entries
              </span>
              <span className="hidden md:inline text-base-content/30" aria-hidden>
                •
              </span>
              <span>Sorted by {sortLabel} ({sortDir === "asc" ? "asc" : "desc"})</span>
            </div>
          </div>
          <CoverageTable
            rows={visibleTree}
            pageKeys={pageKeys}
            query={query}
            show={{ line: showLine, branch: showBranch, method: showMethod, fullMethod: showFullMethod }}
            groupBy={groupBy}
            expandedAllKey={expandedAllKey}
            thresholds={thresholds}
            sortKey={sortKey}
            sortDir={sortDir}
            setSortKey={setSortKey}
            setSortDir={setSortDir}
          />
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   Table
   ========================================================================= */

type SortKey =
  | "name"
  | "linePct" | "coveredLines" | "uncoveredLines" | "coverableLines" | "totalLines"
  | "branchPct" | "coveredBranches" | "totalBranches"
  | "methodPct" | "coveredMethods" | "totalMethods" | "fullMethodPct" | "fullCoveredMethods";

function CoverageTable({
  rows,
  pageKeys, // which flattened keys are visible on this page
  query,
  show,
  groupBy,
  expandedAllKey,
  thresholds,
  sortKey, sortDir, setSortKey, setSortDir,
}: {
  rows: CoverageRow[];
  pageKeys: Set<string>;
  query: string;
  show: { line: boolean; branch: boolean; method: boolean; fullMethod: boolean };
  groupBy: "assembly" | "namespace" | "class";
  expandedAllKey: "expand" | "collapse" | null;
  thresholds?: { total?: number };
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  setSortKey: (k: SortKey) => void;
  setSortDir: (d: "asc" | "desc") => void;
}) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  // Expand/Collapse all
  React.useEffect(() => {
    if (!expandedAllKey) return;
    const next: Record<string, boolean> = {};
    const walk = (node: CoverageRow) => {
      next[rowKey(node)] = expandedAllKey === "expand";
      node.children?.forEach(walk);
    };
    rows.forEach(walk);
    setExpanded(next);
  }, [expandedAllKey, rows]);

  // Sorting toggles
  const onSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir(k === "name" ? "asc" : "desc"); }
  };

  const colSpan =
    1 + // name
    (show.line ? 5 : 0) +
    (show.branch ? 3 : 0) +
    (show.method ? 3 : 0) +
    (show.fullMethod ? 3 : 0);

  // Render only the nodes that are on this page (preserves tree structure while paging)
  const filterToPage = React.useCallback((nodes: CoverageRow[]): CoverageRow[] => {
    return nodes
      .map((n) => {
        const key = rowKey(n);
        if (pageKeys.has(key)) {
          // include whole subtree if parent is on the page
          return n;
        }
        const kids = n.children ? filterToPage(n.children) : undefined;
        return kids && kids.length ? { ...n, children: kids } : null;
      })
      .filter(Boolean) as CoverageRow[];
  }, [pageKeys]);

const pageTree = React.useMemo(() => filterToPage(rows), [rows, filterToPage]);

  return (
    <div className="overflow-auto rounded-2xl border border-base-content/10 bg-base-100/70">
      <table className="table table-zebra">
        <thead className="sticky top-0 z-[1] bg-base-100/95 backdrop-blur">
          <tr>
            <Th label="Name" k="name" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="w-[30%]" />
            {show.line && (
              <>
                <Th label="Covered"   k="coveredLines"   sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <Th label="Uncovered" k="uncoveredLines" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <Th label="Coverable" k="coverableLines" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <Th label="Total"     k="totalLines"     sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <Th label="Line %"    k="linePct"        sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              </>
            )}
            {show.branch && (
              <>
                <Th label="Covered"   k="coveredBranches" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <Th label="Total"     k="totalBranches"   sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <Th label="Branch %"  k="branchPct"       sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              </>
            )}
            {show.method && (
              <>
                <Th label="Covered"   k="coveredMethods" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <Th label="Total"     k="totalMethods"   sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <Th label="Method %"  k="methodPct"      sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              </>
            )}
            {show.fullMethod && (
              <>
                <Th label="Fully covered" k="fullCoveredMethods" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <Th label="Total"         k="totalMethods"       sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <Th label="Full method %" k="fullMethodPct"      sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {pageTree.length === 0 ? (
            <tr><td colSpan={colSpan}><EmptyState message="No results. Try adjusting your filters." /></td></tr>
          ) : (
            pageTree.map((row) => (
              <CoverageRowItem
                key={rowKey(row)}
                row={row}
                show={show}
                level={0}
                expanded={expanded}
                setExpanded={setExpanded}
                thresholds={thresholds}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* Row item (memoized) */
const CoverageRowItem = React.memo(function CoverageRowItem({
  row, show, level, expanded, setExpanded, thresholds,
}: {
  row: CoverageRow;
  show: { line: boolean; branch: boolean; method: boolean; fullMethod: boolean };
  level: number;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  thresholds?: { total?: number };
}) {
  const hasChildren = !!row.children?.length;
  const key = rowKey(row);
  const isOpen = expanded[key] ?? true;

  const toggle = () => setExpanded((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));

  const underThreshold =
    typeof thresholds?.total === "number" &&
    Number.isFinite(row.lines.pct) &&
    row.lines.pct < thresholds!.total!;

  return (
    <>
      <tr className={underThreshold ? "bg-error/5" : undefined}>
        <td>
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 16}px` }}>
            {hasChildren ? (
              <button
                className="btn btn-ghost btn-xs"
                onClick={toggle}
                aria-expanded={isOpen}
                aria-label={isOpen ? "Collapse" : "Expand"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                  {isOpen ? <path fill="currentColor" d="M7 10l5 5 5-5z" /> : <path fill="currentColor" d="M7 14l5-5 5 5z" />}
                </svg>
              </button>
            ) : (
              <span className="w-5" />
            )}
            <div className="min-w-0">
              <div className="truncate font-medium">{row.name}</div>
              {row.path && <div className="truncate text-xs text-base-content/60">{row.path}</div>}
            </div>
            {underThreshold && <span className="badge badge-error badge-outline ml-1">under {thresholds!.total}%</span>}
          </div>
        </td>

        {/* Line */}
        {show.line && (
          <>
            <td className="tabular-nums">{row.lines.covered}</td>
            <td className="tabular-nums">{row.lines.uncovered}</td>
            <td className="tabular-nums">{row.lines.coverable}</td>
            <td className="tabular-nums">{row.lines.total}</td>
            <td className="tabular-nums font-medium">{fmtPct(row.lines.pct)}</td>
          </>
        )}

        {/* Branch */}
        {show.branch && (
          <>
            <td className="tabular-nums">{row.branches?.covered ?? "—"}</td>
            <td className="tabular-nums">{row.branches?.total ?? "—"}</td>
            <td className="tabular-nums font-medium">{row.branches ? fmtPct(row.branches.pct) : "—"}</td>
          </>
        )}

        {/* Method */}
        {show.method && (
          <>
            <td className="tabular-nums">{row.methods?.covered ?? "—"}</td>
            <td className="tabular-nums">{row.methods?.total ?? "—"}</td>
            <td className="tabular-nums font-medium">{row.methods ? fmtPct(row.methods.pct) : "—"}</td>
          </>
        )}

        {/* Full Method */}
        {show.fullMethod && (
          <>
            <td className="tabular-nums">{row.methods?.fullCovered ?? "—"}</td>
            <td className="tabular-nums">{row.methods?.total ?? "—"}</td>
            <td className="tabular-nums font-medium">{row.methods ? fmtPct(row.methods.fullPct) : "—"}</td>
          </>
        )}
      </tr>

      {hasChildren && isOpen &&
        row.children!.map((child) => (
          <CoverageRowItem
            key={rowKey(child)}
            row={child}
            show={show}
            level={level + 1}
            expanded={expanded}
            setExpanded={setExpanded}
            thresholds={thresholds}
          />
        ))}
    </>
  );
});

function friendlySortLabel(key: SortKey): string {
  switch (key) {
    case "name": return "Name";
    case "linePct": return "Line %";
    case "coveredLines": return "Covered lines";
    case "uncoveredLines": return "Uncovered lines";
    case "coverableLines": return "Coverable lines";
    case "totalLines": return "Total lines";
    case "branchPct": return "Branch %";
    case "coveredBranches": return "Covered branches";
    case "totalBranches": return "Total branches";
    case "methodPct": return "Method %";
    case "coveredMethods": return "Covered methods";
    case "totalMethods": return "Total methods";
    case "fullMethodPct": return "Full method %";
    case "fullCoveredMethods": return "Fully covered methods";
    default:
      return key;
  }
}

/* =========================================================================
   Tiny atoms
   ========================================================================= */

function CheckToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        checked
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-base-content/10 bg-base-100/80 text-base-content/70 hover:border-base-content/30",
      ].join(" ")}
    >
      <input
        type="checkbox"
        className="checkbox checkbox-xs border-base-content/20 [--chkbg:theme(colors.primary)] [--chkfg:white]"
        checked={checked}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: T | string;
  onChange: (v: T | string) => void;
  options: { value: T | string; label: string }[];
  className?: string;
}) {
  return (
    <label className={`form-control ${className ?? ""}`}>
      <div className="label py-1">
        <span className="label-text text-xs uppercase tracking-[0.2em] text-base-content/50">{label}</span>
      </div>
      <select
        className="select select-sm border border-base-content/10 bg-base-100/90 focus:outline-none focus:ring-2 focus:ring-primary/30"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label
      className={[
        "input input-sm flex items-center gap-3 rounded-full border border-base-content/10 bg-base-100/80 backdrop-blur",
        className ?? "",
      ].join(" ")}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden className="text-base-content/60">
        <path
          fill="currentColor"
          d="M10 18a8 8 0 1 1 6.32-3.16L22 20.5L20.5 22l-5.7-5.7A8 8 0 0 1 10 18m0-2a6 6 0 1 0 0-12a6 6 0 0 0 0 12"
        />
      </svg>
      <input
        type="text"
        className="grow bg-transparent text-sm focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Th({
  label, k, sortKey, sortDir, onSort, className,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const active = k === sortKey;
  return (
    <th className={className}>
      <button
        className={[
          "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs uppercase tracking-wider transition-colors",
          active
            ? "border-primary/40 bg-primary/10 font-semibold text-primary"
            : "border-transparent text-base-content/60 hover:border-base-content/20 hover:text-base-content",
        ].join(" ")}
        onClick={() => onSort(k)}
        aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      >
        {label}
        <span className="ml-1 opacity-70" aria-hidden>
          {active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="py-8 text-center text-sm text-base-content/60">{message}</div>;
}

/* =========================================================================
   Sort + Export helpers
   ========================================================================= */

function rowKey(r: CoverageRow) {
  return r.path ? `${r.kind}:${r.path}` : `${r.kind}:${r.name}`;
}

function cmpRow(a: CoverageRow, b: CoverageRow, key: SortKey, dir: "asc" | "desc") {
  const mul = dir === "asc" ? 1 : -1;
  const nv = (n: number | undefined | null) => (Number.isFinite(n as number) ? (n as number) : -Infinity);

  switch (key) {
    case "name":              return mul * a.name.localeCompare(b.name);
    case "linePct":           return mul * (nv(a.lines.pct) - nv(b.lines.pct));
    case "coveredLines":      return mul * (nv(a.lines.covered) - nv(b.lines.covered));
    case "uncoveredLines":    return mul * (nv(a.lines.uncovered) - nv(b.lines.uncovered));
    case "coverableLines":    return mul * (nv(a.lines.coverable) - nv(b.lines.coverable));
    case "totalLines":        return mul * (nv(a.lines.total) - nv(b.lines.total));

    case "branchPct":         return mul * (nv(a.branches?.pct ?? NaN) - nv(b.branches?.pct ?? NaN));
    case "coveredBranches":   return mul * (nv(a.branches?.covered ?? NaN) - nv(b.branches?.covered ?? NaN));
    case "totalBranches":     return mul * (nv(a.branches?.total ?? NaN) - nv(b.branches?.total ?? NaN));

    case "methodPct":         return mul * (nv(a.methods?.pct ?? NaN) - nv(b.methods?.pct ?? NaN));
    case "coveredMethods":    return mul * (nv(a.methods?.covered ?? NaN) - nv(b.methods?.covered ?? NaN));
    case "totalMethods":      return mul * (nv(a.methods?.total ?? NaN) - nv(b.methods?.total ?? NaN));
    case "fullMethodPct":     return mul * (nv(a.methods?.fullPct ?? NaN) - nv(b.methods?.fullPct ?? NaN));
    case "fullCoveredMethods":return mul * (nv(a.methods?.fullCovered ?? NaN) - nv(b.methods?.fullCovered ?? NaN));

    default:                  return 0;
  }
}

function flatten(nodes: CoverageRow[], depth = 0): { row: CoverageRow; depth: number }[] {
  const out: { row: CoverageRow; depth: number }[] = [];
  for (const n of nodes) {
    out.push({ row: n, depth });
    if (n.children?.length) out.push(...flatten(n.children, depth + 1));
  }
  return out;
}

function toCsvRecord(r: CoverageRow, depth: number) {
  return {
    depth,
    kind: r.kind,
    name: r.name,
    path: r.path ?? "",
    coveredLines: r.lines.covered,
    uncoveredLines: r.lines.uncovered,
    coverableLines: r.lines.coverable,
    totalLines: r.lines.total,
    linePct: r.lines.pct,
    coveredBranches: r.branches?.covered ?? "",
    totalBranches: r.branches?.total ?? "",
    branchPct: r.branches?.pct ?? "",
    coveredMethods: r.methods?.covered ?? "",
    totalMethods: r.methods?.total ?? "",
    methodPct: r.methods?.pct ?? "",
    fullCoveredMethods: r.methods?.fullCovered ?? "",
    fullMethodPct: r.methods?.fullPct ?? "",
    deltaL: r.delta?.linePct ?? "",
    deltaB: r.delta?.branchPct ?? "",
    deltaM: r.delta?.methodPct ?? "",
    deltaFM: r.delta?.fullMethodPct ?? "",
  };
}

function csvEscape(v: unknown) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* =========================================================================
   Utils
   ========================================================================= */

function fmtPct(n: number) {
  return Number.isFinite(n) ? `${Math.min(100, Math.max(0, n)).toFixed(1)}%` : "—";
}
