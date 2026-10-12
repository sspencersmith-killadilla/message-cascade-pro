import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo-mark.png";
import { cn } from "@/lib/utils";

export function Brand({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("flex items-center gap-2", className)}>
      <img src={logo} alt="" width={32} height={32} className="h-8 w-8" />
      <span className="font-serif text-xl font-bold tracking-tight text-primary">Cadence</span>
    </Link>
  );
}
