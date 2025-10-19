import type { RunResult } from "./types";

type Props = {
  result: RunResult;
  onDismiss: () => void;
};

export default function RunResultBanner({ result, onDismiss }: Props) {
  const isSuccess = result.state === "success";
  const toneClasses = isSuccess
    ? "border-success/50 bg-success/10 text-success"
    : "border-error/50 bg-error/10 text-error";
  const title = isSuccess ? "Tests passed" : "Tests failed";

  return (
    <div
      className={[
        "rounded-3xl border px-6 py-5 shadow-lg shadow-primary/5 backdrop-blur",
        toneClasses,
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start gap-4">
        <span
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-lg font-semibold",
            isSuccess ? "border-success/60 bg-success/10" : "border-error/60 bg-error/10",
          ].join(" ")}
          aria-hidden
        >
          {isSuccess ? (
            <svg width="18" height="18" viewBox="0 0 24 24" className="text-success">
              <path
                fill="currentColor"
                d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1 14l-4-4l1.41-1.41L11 13.17l5.59-5.58L18 9z"
              />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" className="text-error">
              <path
                fill="currentColor"
                d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 13h-2v-2h2Zm0-4h-2V7h2Z"
              />
            </svg>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-base-content/60">
            {title}
          </p>
          <p className="mt-1 text-base font-medium text-base-content">{result.message}</p>
          {result.durationSeconds != null && (
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.3em] text-base-content/50">
              Duration: {result.durationSeconds.toFixed(2)}s
            </p>
          )}
          {(result.stdout || result.stderr) && (
            <details className="mt-4 rounded-2xl border border-base-content/10 bg-base-100/80 p-3">
              <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-[0.3em] text-base-content/60">
                View log output
              </summary>
              <div className="mt-3 space-y-3 text-xs text-base-content/80">
                {result.stdout && (
                  <div>
                    <p className="mb-1 font-semibold uppercase tracking-[0.25em] text-base-content/50">
                      stdout
                    </p>
                    <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-base-200/60 p-3 text-[11px] leading-relaxed">
                      {result.stdout}
                    </pre>
                  </div>
                )}
                {result.stderr && (
                  <div>
                    <p className="mb-1 font-semibold uppercase tracking-[0.25em] text-base-content/50">
                      stderr
                    </p>
                    <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-base-200/60 p-3 text-[11px] leading-relaxed text-error">
                      {result.stderr}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
        <button
          type="button"
          className="btn btn-xs btn-ghost border border-transparent text-base-content/60 hover:border-base-content/20"
          onClick={onDismiss}
          aria-label="Dismiss test results"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              d="M18.3 5.71L12 12l6.3 6.29l-1.41 1.42L10.59 13.4l-6.3 6.3L2.88 18.3l6.3-6.29l-6.3-6.3L4.3 4.29l6.29 6.3l6.3-6.3z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
