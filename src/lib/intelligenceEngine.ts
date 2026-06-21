import type { Candidate, Direction, Hypothesis, IntelligenceSource, Market, NewsItem, StrategyMetric } from "../types";
import { today } from "./seedData";

const themeRules = [
  { theme: "AI 伺服器", keywords: ["ai server", "gb200", "gb300", "伺服器", "server", "rack", "nvlink"] },
  { theme: "半導體", keywords: ["semiconductor", "chip", "gpu", "asic", "晶片", "半導體", "先進製程", "先進封裝"] },
  { theme: "資料中心電力", keywords: ["data center", "power", "electricity", "grid", "資料中心", "電力", "變壓器", "能源"] },
  { theme: "液冷散熱", keywords: ["cooling", "liquid cooling", "thermal", "散熱", "液冷"] },
  { theme: "高股息現金流", keywords: ["dividend", "yield", "高股息", "配息", "殖利率"] },
  { theme: "雲端資安", keywords: ["cybersecurity", "security", "cloud", "資安", "雲端"] },
  { theme: "長線核心科技", keywords: ["platform", "cloud", "ai capex", "software", "平台", "雲端", "軟體"] },
];

const bullishWords = ["成長", "上修", "突破", "強", "需求", "訂單", "擴產", "beat", "growth", "upgrade", "surge"];
const bearishWords = ["下修", "衰退", "風險", "延遲", "禁令", "miss", "cut", "risk", "weak", "delay"];

export function detectThemes(text: string) {
  const lower = text.toLowerCase();
  const themes = themeRules.filter((rule) => rule.keywords.some((keyword) => lower.includes(keyword.toLowerCase()))).map((rule) => rule.theme);
  return themes.length > 0 ? themes : ["市場事件"];
}

export function detectDirection(text: string): Direction {
  const lower = text.toLowerCase();
  const bullish = bullishWords.filter((word) => lower.includes(word.toLowerCase())).length;
  const bearish = bearishWords.filter((word) => lower.includes(word.toLowerCase())).length;
  if (bullish > bearish) return "bullish";
  if (bearish > bullish) return "bearish";
  return "neutral";
}

export function extractTickers(text: string, candidates: Candidate[]) {
  const lower = text.toLowerCase();
  const matches = new Set<string>();

  candidates.forEach((candidate) => {
    const tickerKey = candidate.ticker.toLowerCase().replace(".tw", "").replace(".us", "");
    if (lower.includes(candidate.ticker.toLowerCase()) || lower.includes(tickerKey) || lower.includes(candidate.name.toLowerCase())) {
      matches.add(candidate.ticker);
    }
  });

  const direct = text.match(/\b[A-Z]{2,5}(?:\.[A-Z]{2})?\b/g) ?? [];
  direct.forEach((ticker) => matches.add(ticker));
  return Array.from(matches).slice(0, 8);
}

export function classifyPortfolioRole(theme: string, horizonType: "短線" | "波段" | "長線") {
  if (theme.includes("股息")) return "現金流" as const;
  if (horizonType === "長線") return "資產成長" as const;
  if (horizonType === "短線") return "短線交易" as const;
  return "資產成長" as const;
}

export function strategyForTheme(theme: string, strategies: StrategyMetric[], horizonType: "短線" | "波段" | "長線") {
  const byHorizon = strategies.find((strategy) => strategy.horizon === horizonType && theme.includes(strategy.theme.split("、")[0]));
  if (byHorizon) return byHorizon.strategyId;
  if (theme.includes("股息")) return "S-DIV-ROT";
  if (horizonType === "長線") return "S-LONG-AI";
  if (theme.includes("事件")) return "S-EVENT-DRIFT";
  return "S-AI-MOM";
}

export function createIntelligenceSource({
  title,
  sourceType,
  reliability,
  horizonType,
  rawText,
  candidates,
}: {
  title: string;
  sourceType: IntelligenceSource["sourceType"];
  reliability: number;
  horizonType: IntelligenceSource["horizonType"];
  rawText: string;
  candidates: Candidate[];
}): IntelligenceSource {
  const tickers = extractTickers(`${title}\n${rawText}`, candidates);
  const themes = detectThemes(`${title}\n${rawText}`);
  const summary = rawText
    .split(/\n|。|\. /)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join("。");

  return {
    id: `src-${Date.now()}`,
    createdAt: new Date().toISOString(),
    title,
    sourceType,
    reliability,
    horizonType,
    tickers,
    themes,
    summary,
    rawText,
    convertedHypothesisIds: [],
  };
}

export function hypothesesFromSource(source: IntelligenceSource, candidates: Candidate[], strategies: StrategyMetric[]): Hypothesis[] {
  const direction = detectDirection(source.rawText);
  const themes = source.themes.length > 0 ? source.themes : ["市場事件"];
  const tickers = source.tickers.length > 0 ? source.tickers : candidates.slice(0, 3).map((candidate) => candidate.ticker);
  const horizonDays = source.horizonType === "短線" ? 3 : source.horizonType === "波段" ? 20 : 180;

  return tickers.slice(0, 5).map((ticker, index) => {
    const candidate = candidates.find((item) => item.ticker === ticker || item.ticker.replace(".TW", "") === ticker || item.ticker.replace(".US", "") === ticker);
    const market: Market = candidate?.market ?? (ticker.endsWith(".TW") || /^\d{4}/.test(ticker) ? "TW" : "US");
    const theme = candidate?.theme ?? themes[index % themes.length];
    const hypothesisId = `hyp-${Date.now()}-${index}`;

    return {
      id: hypothesisId,
      date: today,
      market,
      ticker: candidate?.ticker ?? ticker,
      name: candidate?.name ?? ticker,
      strategyId: strategyForTheme(theme, strategies, source.horizonType),
      theme,
      signalSource: `${source.sourceType} / 可信度 ${source.reliability}/5`,
      thesis: `若「${source.title}」中的資訊被市場認可，${candidate?.name ?? ticker} 在 ${horizonDays} 日內應出現符合 ${theme} 的相對強弱反應。`,
      direction,
      horizonDays,
      confidence: Math.min(92, 45 + source.reliability * 8 + (candidate?.sourceCount ?? 0) * 3),
      entryRule: source.horizonType === "長線" ? "基本面或產業趨勢延續，且價格未跌破長期趨勢支撐" : "訊號出現後量價同步轉強，且相對大盤強勢",
      exitRule: source.horizonType === "長線" ? "產業論點破壞、成長假設下修或估值過度偏離" : "達成預期反應、時間到期或族群強度轉弱",
      stopRule: source.horizonType === "長線" ? "核心假設失效或基本面證據反轉" : "跌破觸發低點或單筆風險超過規則",
      status: "watching",
      horizonType: source.horizonType,
      portfolioRole: classifyPortfolioRole(theme, source.horizonType),
      sourceId: source.id,
      evidence: source.summary,
    };
  });
}

export function newsToCandidateSignal(news: NewsItem, candidates: Candidate[], strategies: StrategyMetric[]) {
  const source = createIntelligenceSource({
    title: news.title,
    sourceType: news.source.includes("SEC") ? "公告" : "新聞",
    reliability: news.source.includes("SEC") ? 5 : 3,
    horizonType: news.theme.includes("高股息") ? "長線" : "短線",
    rawText: `${news.title}\n${news.summary ?? ""}\n${news.rawContent ?? ""}\n${news.url ?? ""}`,
    candidates,
  });
  return hypothesesFromSource(source, candidates, strategies)[0];
}
