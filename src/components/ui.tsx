import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Market } from "../types";
import { formatPct } from "../lib/strategyScore";

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-header">
        <h2>{title}</h2>
        {action ? <div className="panel-action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function ToneValue({ value, compact = false }: { value: number; compact?: boolean }) {
  const tone = value > 0 ? "positive" : value < 0 ? "negative" : "neutral";
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return (
    <span className={`tone ${tone}`}>
      <Icon size={compact ? 13 : 15} />
      {formatPct(value, compact ? 1 : 2)}
    </span>
  );
}

export function MarketBadge({ market }: { market: Market }) {
  return <span className={`market-badge ${market.toLowerCase()}`}>{market === "TW" ? "台股" : "美股"}</span>;
}

export function ScorePill({ score }: { score: number }) {
  const tone = score >= 78 ? "score-high" : score >= 62 ? "score-mid" : "score-low";
  return <span className={`score-pill ${tone}`}>{score}</span>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty-state">{children}</div>;
}
