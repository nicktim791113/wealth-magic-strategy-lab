import type { LucideIcon } from "lucide-react";

export type Market = "TW" | "US";

export type ExperimentStatus = "watching" | "triggered" | "won" | "lost" | "expired";

export type Direction = "bullish" | "bearish" | "neutral";

export type SectionKey =
  | "dashboard"
  | "intelligence"
  | "experiments"
  | "strategies"
  | "trades"
  | "review"
  | "database"
  | "guide";

export interface NavItem {
  key: SectionKey;
  label: string;
  icon: LucideIcon;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  changePct: number;
  tone: "up" | "down" | "flat";
}

export interface Candidate {
  id: string;
  market: Market;
  ticker: string;
  name: string;
  theme: string;
  catalyst: string;
  price: number;
  changePct?: number;
  volumeRatio: number;
  technicalSignal: string;
  expectedHorizon: string;
  horizonType?: "短線" | "波段" | "長線";
  setupScore: number;
  sourceCount?: number;
  sourceQuality?: number;
  newsDigest?: string[];
  dataSource?: string;
  lastUpdated?: string;
}

export interface Hypothesis {
  id: string;
  date: string;
  market: Market;
  ticker: string;
  name: string;
  strategyId: string;
  theme: string;
  signalSource: string;
  thesis: string;
  direction: Direction;
  horizonDays: number;
  confidence: number;
  entryRule: string;
  exitRule: string;
  stopRule: string;
  status: ExperimentStatus;
  actualReturnPct?: number;
  horizonType?: "短線" | "波段" | "長線";
  portfolioRole?: "現金流" | "資產成長" | "短線交易" | "風險觀察";
  sourceId?: string;
  evidence?: string;
}

export interface StrategyMetric {
  strategyId: string;
  name: string;
  marketScope: string;
  theme: string;
  horizon?: "短線" | "波段" | "長線";
  version: string;
  sampleSize: number;
  wins: number;
  avgGainPct: number;
  avgLossPct: number;
  maxDrawdownPct: number;
  falseSignalRate: number;
  active: boolean;
}

export interface StrategyScore {
  winRate: number;
  payoffRatio: number;
  expectancyPct: number;
  sampleConfidence: number;
  riskPenalty: number;
  score: number;
  grade: "A" | "B" | "C" | "D";
}

export interface SimulatedTrade {
  id: string;
  date: string;
  market: Market;
  ticker: string;
  name: string;
  strategyId: string;
  side: "long" | "short";
  entryPrice: number;
  targetPrice: number;
  stopPrice: number;
  plannedRiskPct: number;
  status: "open" | "target" | "stopped" | "manual_exit";
  resultPct?: number;
  note: string;
}

export interface WorkflowTask {
  id: string;
  phase: "盤前" | "盤中" | "盤後" | "週檢討";
  label: string;
}

export interface SchemaField {
  name: string;
  type: string;
  purpose: string;
}

export interface SchemaTable {
  name: string;
  purpose: string;
  fields: SchemaField[];
}

export interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  rawContent?: string;
  source: string;
  url?: string;
  publishedAt?: string;
  query?: string;
  theme: string;
  tickers: string[];
  sentiment: Direction;
  relevanceScore: number;
}

export interface DataSourceStatus {
  name: string;
  type: "quote" | "news" | "filing" | "manual" | "video" | "optional-api";
  status: "connected" | "fallback" | "manual" | "needs-key" | "error";
  detail: string;
  url?: string;
}

export interface MarketDataSnapshot {
  generatedAt: string;
  marketIndexes: MarketIndex[];
  candidates: Candidate[];
  newsItems: NewsItem[];
  sources: DataSourceStatus[];
}

export interface IntelligenceSource {
  id: string;
  createdAt: string;
  title: string;
  sourceType: "新聞" | "影片" | "公告" | "法說" | "社群" | "手動筆記";
  reliability: number;
  horizonType: "短線" | "波段" | "長線";
  tickers: string[];
  themes: string[];
  summary: string;
  rawText: string;
  convertedHypothesisIds: string[];
}
