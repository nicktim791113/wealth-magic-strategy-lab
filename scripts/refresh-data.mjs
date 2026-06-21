import { mkdir, writeFile } from "node:fs/promises";

const outFile = new URL("../public/data/market-lab-latest.json", import.meta.url);

const universe = [
  { market: "TW", ticker: "2330.TW", code: "2330", name: "台積電", theme: "半導體", horizonType: "波段" },
  { market: "TW", ticker: "2317.TW", code: "2317", name: "鴻海", theme: "AI 伺服器", horizonType: "短線" },
  { market: "TW", ticker: "2382.TW", code: "2382", name: "廣達", theme: "AI 伺服器", horizonType: "短線" },
  { market: "TW", ticker: "3231.TW", code: "3231", name: "緯創", theme: "AI 伺服器", horizonType: "短線" },
  { market: "TW", ticker: "6669.TW", code: "6669", name: "緯穎", theme: "AI 伺服器", horizonType: "波段" },
  { market: "TW", ticker: "2308.TW", code: "2308", name: "台達電", theme: "資料中心電力", horizonType: "長線" },
  { market: "TW", ticker: "2454.TW", code: "2454", name: "聯發科", theme: "半導體", horizonType: "波段" },
  { market: "TW", ticker: "2376.TW", code: "2376", name: "技嘉", theme: "AI 伺服器", horizonType: "短線" },
  { market: "TW", ticker: "0056.TW", code: "0056", name: "元大高股息", theme: "高股息現金流", horizonType: "長線" },
  { market: "TW", ticker: "00878.TW", code: "00878", name: "國泰永續高股息", theme: "高股息現金流", horizonType: "長線" },
  { market: "US", ticker: "NVDA", name: "NVIDIA", theme: "半導體", horizonType: "短線" },
  { market: "US", ticker: "AMD", name: "AMD", theme: "半導體", horizonType: "短線" },
  { market: "US", ticker: "AVGO", name: "Broadcom", theme: "AI ASIC", horizonType: "波段" },
  { market: "US", ticker: "TSM", name: "TSMC ADR", theme: "半導體", horizonType: "波段" },
  { market: "US", ticker: "MSFT", name: "Microsoft", theme: "長線核心科技", horizonType: "長線" },
  { market: "US", ticker: "AMZN", name: "Amazon", theme: "長線核心科技", horizonType: "長線" },
  { market: "US", ticker: "GOOGL", name: "Alphabet", theme: "長線核心科技", horizonType: "長線" },
  { market: "US", ticker: "VRT", name: "Vertiv", theme: "資料中心電力", horizonType: "波段" },
  { market: "US", ticker: "ANET", name: "Arista Networks", theme: "AI 網通", horizonType: "波段" },
  { market: "US", ticker: "CRWD", name: "CrowdStrike", theme: "雲端資安", horizonType: "波段" },
  { market: "US", ticker: "SMH", name: "VanEck Semiconductor ETF", theme: "半導體 ETF", horizonType: "長線" },
  { market: "US", ticker: "QQQ", name: "Nasdaq 100 ETF", theme: "長線核心科技", horizonType: "長線" },
];

const indexSymbols = [
  { symbol: "^TWII", name: "台股加權", display: "TAIEX" },
  { symbol: "^IXIC", name: "那斯達克", display: "NASDAQ" },
  { symbol: "^SOX", name: "費半", display: "SOX" },
  { symbol: "^VIX", name: "波動率", display: "VIX" },
  { symbol: "TWD=X", name: "美元台幣", display: "USD/TWD" },
];

const newsFeeds = [
  {
    name: "SEC Press Releases",
    type: "filing",
    url: "https://www.sec.gov/news/pressreleases.rss",
    query: "SEC official",
    theme: "監管與公告",
  },
  {
    name: "Google News - AI semiconductor",
    type: "news",
    url: "https://news.google.com/rss/search?q=AI%20semiconductor%20NVIDIA%20TSMC%20data%20center%20when%3A3d&hl=zh-TW&gl=TW&ceid=TW%3Azh-Hant",
    query: "AI semiconductor NVIDIA TSMC data center",
    theme: "半導體",
  },
  {
    name: "Google News - 台股 AI 伺服器",
    type: "news",
    url: "https://news.google.com/rss/search?q=%E5%8F%B0%E8%82%A1%20AI%20%E4%BC%BA%E6%9C%8D%E5%99%A8%20%E5%8D%8A%E5%B0%8E%E9%AB%94%20when%3A3d&hl=zh-TW&gl=TW&ceid=TW%3Azh-Hant",
    query: "台股 AI 伺服器 半導體",
    theme: "AI 伺服器",
  },
  {
    name: "Google News - data center power",
    type: "news",
    url: "https://news.google.com/rss/search?q=AI%20data%20center%20power%20grid%20Vertiv%20when%3A7d&hl=zh-TW&gl=TW&ceid=TW%3Azh-Hant",
    query: "AI data center power grid",
    theme: "資料中心電力",
  },
  {
    name: "Google News - 高股息 ETF",
    type: "news",
    url: "https://news.google.com/rss/search?q=%E5%8F%B0%E8%82%A1%20%E9%AB%98%E8%82%A1%E6%81%AF%20ETF%20%E9%85%8D%E6%81%AF%20when%3A7d&hl=zh-TW&gl=TW&ceid=TW%3Azh-Hant",
    query: "台股 高股息 ETF 配息",
    theme: "高股息現金流",
  },
];

function toNumber(value) {
  if (value === undefined || value === null || value === "") return 0;
  const normalized = String(value).replaceAll(",", "");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function changeTone(changePct) {
  if (changePct > 0.05) return "up";
  if (changePct < -0.05) return "down";
  return "flat";
}

function decodeHtml(value = "") {
  return value
    .replaceAll("<![CDATA[", "")
    .replaceAll("]]>", "")
    .replace(/<[^>]+>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .trim();
}

function tag(block, name) {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  return decodeHtml(match?.[1] ?? "");
}

function parseRss(xml, feed) {
  return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].slice(0, 12).map((match, index) => {
    const block = match[1];
    const title = tag(block, "title");
    const summary = tag(block, "description") || tag(block, "content:encoded");
    const link = tag(block, "link");
    const publishedAt = tag(block, "pubDate") || tag(block, "updated");
    return {
      id: `${feed.name}-${index}-${title.slice(0, 16)}`.replace(/\W+/g, "-"),
      title,
      summary,
      rawContent: [`title: ${title}`, `source: ${feed.name}`, `query: ${feed.query}`, `published: ${publishedAt}`, `link: ${link}`, `summary: ${summary}`]
        .filter((line) => !line.endsWith(": "))
        .join("\n"),
      source: feed.name,
      url: link,
      publishedAt,
      query: feed.query,
      theme: feed.theme,
      tickers: [],
      sentiment: "neutral",
      relevanceScore: 50,
    };
  });
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": "wealth-magic-strategy-lab/0.1 contact: local-user",
      Accept: "application/json,text/plain,*/*",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "wealth-magic-strategy-lab/0.1 contact: local-user",
      Accept: "application/rss+xml,text/xml,text/plain,*/*",
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function fetchYahooChart(symbol) {
  const encoded = encodeURIComponent(symbol);
  const json = await fetchJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?range=1mo&interval=1d`);
  const result = json.chart?.result?.[0];
  if (!result) throw new Error(`No chart result for ${symbol}`);

  const meta = result.meta ?? {};
  const quote = result.indicators?.quote?.[0] ?? {};
  const closes = (result.indicators?.quote?.[0]?.close ?? []).filter((value) => Number.isFinite(value));
  const volumes = (quote.volume ?? []).filter((value) => Number.isFinite(value));
  const price = Number(meta.regularMarketPrice ?? closes.at(-1) ?? 0);
  const previousClose = Number(closes.length > 1 ? closes.at(-2) : (meta.previousClose ?? meta.chartPreviousClose ?? price));
  const changePct = previousClose ? ((price - previousClose) / previousClose) * 100 : 0;
  const avgVolume = volumes.length > 1 ? volumes.slice(0, -1).reduce((sum, value) => sum + value, 0) / (volumes.length - 1) : volumes.at(-1) || 1;
  const volumeRatio = avgVolume ? (volumes.at(-1) || avgVolume) / avgVolume : 1;

  return {
    price,
    changePct,
    volumeRatio,
    dayHigh: Number(meta.regularMarketDayHigh ?? 0),
    dayLow: Number(meta.regularMarketDayLow ?? 0),
    currency: meta.currency,
    source: "Yahoo Finance chart",
  };
}

async function fetchTwseMap() {
  const data = await fetchJson("https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL");
  return new Map(
    data.map((row) => [
      row.Code,
      {
        price: toNumber(row.ClosingPrice),
        changePct: toNumber(row.ClosingPrice) ? (toNumber(row.Change) / Math.max(1, toNumber(row.ClosingPrice) - toNumber(row.Change))) * 100 : 0,
        volumeRatio: 1,
        tradeVolume: toNumber(row.TradeVolume),
        source: "TWSE OpenAPI STOCK_DAY_ALL",
      },
    ]),
  );
}

async function safeQuote(item, twseMap) {
  try {
    if (item.market === "TW" && twseMap.has(item.code)) {
      const twse = twseMap.get(item.code);
      const yahoo = await fetchYahooChart(item.ticker).catch(() => null);
      return { ...twse, volumeRatio: yahoo?.volumeRatio ?? 1, source: "TWSE OpenAPI + Yahoo chart volume" };
    }
    return await fetchYahooChart(item.ticker);
  } catch (error) {
    return { price: 0, changePct: 0, volumeRatio: 1, source: `fallback: ${error.message}` };
  }
}

function enrichNews(newsItems) {
  const tickerKeys = universe.map((item) => ({
    ticker: item.ticker,
    terms: [item.ticker.toLowerCase(), item.ticker.replace(".TW", "").toLowerCase(), item.name.toLowerCase()],
  }));

  return newsItems.map((item) => {
    const text = `${item.title} ${item.query ?? ""}`.toLowerCase();
    const tickers = tickerKeys.filter((entry) => entry.terms.some((term) => text.includes(term))).map((entry) => entry.ticker);
    const bullish = ["成長", "上修", "突破", "需求", "訂單", "growth", "surge", "beat", "record"].some((word) => text.includes(word));
    const bearish = ["下修", "風險", "衰退", "延遲", "risk", "weak", "delay", "cut"].some((word) => text.includes(word));
    return {
      ...item,
      tickers,
      sentiment: bullish && !bearish ? "bullish" : bearish && !bullish ? "bearish" : "neutral",
      relevanceScore: Math.min(100, 48 + tickers.length * 15 + (bullish || bearish ? 12 : 0)),
    };
  });
}

function makeCandidate(item, quote, newsItems) {
  const relatedNews = newsItems
    .filter((news) => news.tickers.includes(item.ticker) || news.theme === item.theme || item.theme.includes(news.theme))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 4);
  const newsBoost = Math.min(20, relatedNews.length * 5);
  const momentumScore = Math.max(-15, Math.min(24, quote.changePct * 5));
  const volumeBoost = Math.max(0, Math.min(18, (quote.volumeRatio - 1) * 20));
  const horizonBoost = item.horizonType === "長線" ? 4 : item.horizonType === "波段" ? 7 : 9;
  const setupScore = Math.round(Math.max(35, Math.min(96, 48 + momentumScore + volumeBoost + newsBoost + horizonBoost)));
  const technicalSignal = quote.changePct > 1.5 ? "強勢上漲，等待回測或續強確認" : quote.changePct < -1.5 ? "回檔中，先驗證支撐與消息反應" : "盤整觀察，等待量價觸發";
  const catalyst = relatedNews[0]?.title ?? `${item.theme} 主題觀察，等待新訊號確認`;
  const expectedHorizon = item.horizonType === "短線" ? "1-5 日" : item.horizonType === "波段" ? "5-30 日" : "3-18 個月";

  return {
    id: `${item.market}-${item.ticker}`,
    market: item.market,
    ticker: item.ticker,
    name: item.name,
    theme: item.theme,
    catalyst,
    price: Number(quote.price.toFixed(2)),
    changePct: Number(quote.changePct.toFixed(2)),
    volumeRatio: Number((quote.volumeRatio || 1).toFixed(2)),
    technicalSignal,
    expectedHorizon,
    horizonType: item.horizonType,
    setupScore,
    sourceCount: relatedNews.length,
    sourceQuality: relatedNews.some((news) => news.source.includes("SEC")) ? 5 : relatedNews.length > 1 ? 3 : 2,
    newsDigest: relatedNews.map((news) => news.title),
    dataSource: quote.source,
    lastUpdated: new Date().toISOString(),
  };
}

async function main() {
  const sourceStatus = [];
  const twseMap = await fetchTwseMap()
    .then((map) => {
      sourceStatus.push({
        name: "TWSE OpenAPI",
        type: "quote",
        status: "connected",
        detail: `Loaded ${map.size} TWSE rows`,
        url: "https://openapi.twse.com.tw/",
      });
      return map;
    })
    .catch((error) => {
      sourceStatus.push({
        name: "TWSE OpenAPI",
        type: "quote",
        status: "error",
        detail: error.message,
        url: "https://openapi.twse.com.tw/",
      });
      return new Map();
    });

  const rawNews = [];
  for (const feed of newsFeeds) {
    try {
      const xml = await fetchText(feed.url);
      const items = parseRss(xml, feed);
      rawNews.push(...items);
      sourceStatus.push({
        name: feed.name,
        type: feed.type,
        status: "connected",
        detail: `Loaded ${items.length} RSS items`,
        url: feed.url,
      });
    } catch (error) {
      sourceStatus.push({
        name: feed.name,
        type: feed.type,
        status: "error",
        detail: error.message,
        url: feed.url,
      });
    }
  }

  const newsItems = enrichNews(rawNews).sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 40);
  const quotes = await Promise.all(universe.map((item) => safeQuote(item, twseMap)));
  const candidates = universe
    .map((item, index) => makeCandidate(item, quotes[index], newsItems))
    .sort((a, b) => b.setupScore - a.setupScore)
    .slice(0, 18);

  const indexQuotes = await Promise.all(indexSymbols.map((item) => fetchYahooChart(item.symbol).catch(() => null)));
  const marketIndexes = indexSymbols.map((item, index) => {
    const quote = indexQuotes[index];
    return {
      symbol: item.display,
      name: item.name,
      value: quote?.price ?? 0,
      changePct: Number((quote?.changePct ?? 0).toFixed(2)),
      tone: changeTone(quote?.changePct ?? 0),
    };
  });

  sourceStatus.push({
    name: "Yahoo Finance chart",
    type: "quote",
    status: "connected",
    detail: `Loaded ${quotes.filter((quote) => !quote.source.startsWith("fallback")).length}/${quotes.length} tracked symbols`,
    url: "https://query1.finance.yahoo.com/v8/finance/chart/",
  });
  sourceStatus.push({
    name: "Optional premium APIs",
    type: "optional-api",
    status: "needs-key",
    detail: "Reserved for Finnhub, Alpha Vantage, NewsAPI, broker APIs, or your preferred provider.",
  });

  const snapshot = {
    generatedAt: new Date().toISOString(),
    marketIndexes,
    candidates,
    newsItems,
    sources: sourceStatus,
  };

  await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
  await writeFile(outFile, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outFile.pathname}`);
  console.log(`Candidates: ${candidates.length}, news: ${newsItems.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
