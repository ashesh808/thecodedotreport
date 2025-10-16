export default function Placeholder({ title, mono = false }: { title: string; mono?: boolean }) {
  return (
    <div className="card border">
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className={mono ? "font-mono text-sm text-base-content/70" : "text-sm text-base-content/70"}>
          (stub) we’ll wire this next.
        </p>
      </div>
    </div>
  );
}
