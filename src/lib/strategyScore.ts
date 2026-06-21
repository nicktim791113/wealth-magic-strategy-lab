import type { StrategyMetric, StrategyScore } from "../types";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function calculateStrategyScore(strategy: StrategyMetric): StrategyScore {
  const winRate = strategy.sampleSize > 0 ? strategy.wins / strategy.sampleSize : 0;
  const lossRate = 1 - winRate;
  const payoffRatio = strategy.avgLossPct > 0 ? strategy.avgGainPct / strategy.avgLossPct : 0;
  const expectancyPct = winRate * strategy.avgGainPct - lossRate * strategy.avgLossPct;
  const sampleConfidence = clamp(strategy.sampleSize / 50, 0.18, 1);
  const riskPenalty = strategy.maxDrawdownPct * 0.42 + strategy.falseSignalRate * 8;
  const rawScore = (expectancyPct * 14 + winRate * 34 + payoffRatio * 12) * sampleConfidence - riskPenalty;
  const score = clamp(Math.round(rawScore), 0, 100);

  return {
    winRate,
    payoffRatio,
    expectancyPct,
    sampleConfidence,
    riskPenalty,
    score,
    grade: score >= 78 ? "A" : score >= 62 ? "B" : score >= 45 ? "C" : "D",
  };
}

export function positionSize(capital: number, riskPct: number, stopPct: number) {
  const maxLoss = capital * (riskPct / 100);
  const position = stopPct > 0 ? maxLoss / (stopPct / 100) : 0;
  return {
    maxLoss,
    position,
    positionPct: capital > 0 ? (position / capital) * 100 : 0,
  };
}

export function formatPct(value: number, digits = 1) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: 0,
  }).format(value);
}
