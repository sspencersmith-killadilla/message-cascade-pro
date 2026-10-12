import { Link } from "@tanstack/react-router";

export function PublicFooter() {
  return (
    <footer className="border-t bg-card/50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-muted-foreground">
        <span>Cadence · a sibling of Tandem · MIT licensed</span>
        <div className="flex gap-4">
          <Link to="/demo" className="hover:text-foreground">Demo</Link>
          <Link to="/guide" className="hover:text-foreground">User guide</Link>
          <Link to="/self-host" className="hover:text-foreground">Self-hosting</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
