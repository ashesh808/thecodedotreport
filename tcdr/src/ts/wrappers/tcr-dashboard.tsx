import { createRoot, Root } from "react-dom/client";
import Dashboard from "@/components/Dashboard";
import { DashboardWire } from "@/types";

function readProps(host: HTMLElement): DashboardWire {
  const json = host.querySelector('script[type="application/json"]')?.textContent || "{}";
  return JSON.parse(json);
}

class TcrDashboardElement extends HTMLElement {
  private root: Root | null = null;
  connectedCallback() {
    const props = readProps(this);
    this.root ??= createRoot(this);
    this.root.render(<Dashboard {...props} />);
  }
  disconnectedCallback() {
    this.root?.unmount();
    this.root = null;
  }
}
if (!customElements.get("tcr-dashboard")) {
  customElements.define("tcr-dashboard", TcrDashboardElement);
}
