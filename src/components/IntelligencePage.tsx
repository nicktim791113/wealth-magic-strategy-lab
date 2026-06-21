import { DatabaseZap, FilePlus2, Newspaper, Plus, RadioTower, Video } from "lucide-react";
import { useMemo, useState } from "react";
import type { Candidate, Hypothesis, IntelligenceSource, MarketDataSnapshot, StrategyMetric } from "../types";
import { createIntelligenceSource, hypothesesFromSource, newsToCandidateSignal } from "../lib/intelligenceEngine";
import { MarketBadge, Panel, ScorePill } from "./ui";

const sourceTypes: IntelligenceSource["sourceType"][] = ["新聞", "影片", "公告", "法說", "社群", "手動筆記"];
const horizons: IntelligenceSource["horizonType"][] = ["短線", "波段", "長線"];

export function IntelligencePage({
  candidates,
  strategies,
  snapshot,
  dataError,
  intelligenceSources,
  onAddSource,
  onAddHypothesis,
}: {
  candidates: Candidate[];
  strategies: StrategyMetric[];
  snapshot: MarketDataSnapshot | null;
  dataError: string;
  intelligenceSources: IntelligenceSource[];
  onAddSource: (source: IntelligenceSource) => void;
  onAddHypothesis: (hypothesis: Hypothesis) => void;
}) {
  const [title, setTitle] = useState("AI 資料中心需求更新");
  const [sourceType, setSourceType] = useState<IntelligenceSource["sourceType"]>("新聞");
  const [horizonType, setHorizonType] = useState<IntelligenceSource["horizonType"]>("短線");
  const [reliability, setReliability] = useState(3);
  const [rawText, setRawText] = useState(
    "貼上新聞重點、財報摘要、法說內容，或金融影片逐字稿。系統會抽出題材、可能影響標的、預期方向與驗證天數，先生成假設草稿。",
  );
  const [drafts, setDrafts] = useState<Hypothesis[]>([]);

  const sourceStats = useMemo(() => {
    const connected = snapshot?.sources.filter((source) => source.status === "connected").length ?? 0;
    const total = snapshot?.sources.length ?? 0;
    return { connected, total };
  }, [snapshot]);

  function buildDrafts() {
    const source = createIntelligenceSource({
      title,
      sourceType,
      reliability,
      horizonType,
      rawText,
      candidates,
    });
    const nextDrafts = hypothesesFromSource(source, candidates, strategies);
    onAddSource({ ...source, convertedHypothesisIds: nextDrafts.map((item) => item.id) });
    setDrafts(nextDrafts);
  }

  function addDraft(hypothesis: Hypothesis) {
    onAddHypothesis(hypothesis);
    setDrafts((current) => current.filter((item) => item.id !== hypothesis.id));
  }

  function addNewsAsHypothesis(index: number) {
    const news = snapshot?.newsItems[index];
    if (!news) return;
    const hypothesis = newsToCandidateSignal(news, candidates, strategies);
    if (hypothesis) onAddHypothesis(hypothesis);
  }

  return (
    <div className="intelligence-page">
      <Panel
        title="自動資料狀態"
        action={
          <span className={`status-chip ${snapshot ? "active" : "paused"}`}>
            <RadioTower size={14} />
            {snapshot ? `${sourceStats.connected}/${sourceStats.total} 已連線` : "使用示範資料"}
          </span>
        }
      >
        <div className="source-status-grid">
          {snapshot?.sources.map((source) => (
            <article className="source-status-card" key={`${source.name}-${source.status}`}>
              <div>
                <strong>{source.name}</strong>
                <span>{source.type}</span>
              </div>
              <span className={`source-state ${source.status}`}>{source.status}</span>
              <p>{source.detail}</p>
            </article>
          )) ?? (
            <div className="empty-state">
              尚未讀到每日資料檔。請先執行 <code>npm run refresh:data</code>，再重新整理頁面。
              {dataError ? <span>錯誤：{dataError}</span> : null}
            </div>
          )}
        </div>
      </Panel>

      <div className="intelligence-grid">
        <Panel title="貼上資訊 / 影片摘要" className="intake-panel">
          <div className="intake-form">
            <label>
              <span>標題</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label>
              <span>來源類型</span>
              <select value={sourceType} onChange={(event) => setSourceType(event.target.value as IntelligenceSource["sourceType"])}>
                {sourceTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>驗證週期</span>
              <select value={horizonType} onChange={(event) => setHorizonType(event.target.value as IntelligenceSource["horizonType"])}>
                {horizons.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>來源可信度 {reliability}/5</span>
              <input type="range" min={1} max={5} step={1} value={reliability} onChange={(event) => setReliability(Number(event.target.value))} />
            </label>
            <label className="full-span">
              <span>內容</span>
              <textarea value={rawText} onChange={(event) => setRawText(event.target.value)} />
            </label>
            <button className="primary-button full-span" type="button" onClick={buildDrafts}>
              <FilePlus2 size={16} />
              生成假設草稿
            </button>
          </div>
        </Panel>

        <Panel title="假設草稿" className="draft-panel">
          <div className="draft-list">
            {drafts.length === 0 ? (
              <div className="empty-state">貼上資訊後，這裡會產生可加入「假設實驗」的草稿。</div>
            ) : (
              drafts.map((draft) => (
                <article className="draft-item" key={draft.id}>
                  <header>
                    <div className="row-title">
                      <strong>{draft.ticker}</strong>
                      <span>{draft.theme}</span>
                      <MarketBadge market={draft.market} />
                    </div>
                    <ScorePill score={draft.confidence} />
                  </header>
                  <p>{draft.thesis}</p>
                  <div className="experiment-rules">
                    <span>週期：{draft.horizonType} / {draft.horizonDays} 日</span>
                    <span>角色：{draft.portfolioRole}</span>
                    <span>證據：{draft.evidence}</span>
                  </div>
                  <button className="primary-button" type="button" onClick={() => addDraft(draft)}>
                    <Plus size={15} />
                    加入假設實驗
                  </button>
                </article>
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="intelligence-grid">
        <Panel
          title="自動挖掘新聞"
          action={
            <span className="status-chip">
              <Newspaper size={14} />
              {snapshot?.newsItems.length ?? 0} 則
            </span>
          }
        >
          <div className="mining-method">
            <div>
              <strong>更新方式</strong>
              <code>npm run refresh:data</code>
              <span>重新整理頁面後讀取最新 `public/data/market-lab-latest.json`。</span>
            </div>
            <div>
              <strong>挖掘方法</strong>
              <span>RSS 主題查詢 + 官方公告 + 追蹤清單代號比對 + 題材/情緒/相關度評分。</span>
            </div>
          </div>
          <div className="news-list">
            {(snapshot?.newsItems ?? []).slice(0, 10).map((news, index) => (
              <article className="news-row" key={news.id}>
                <div className="news-content">
                  <strong>{news.title}</strong>
                  <span>{news.source} · {news.theme} · {news.sentiment}</span>
                  {news.summary ? <p>{news.summary}</p> : null}
                  <details>
                    <summary>原始內容 / 來源</summary>
                    <pre>{news.rawContent ?? news.title}</pre>
                    {news.url ? (
                      <a href={news.url} target="_blank" rel="noreferrer">
                        開啟原文
                      </a>
                    ) : null}
                  </details>
                </div>
                <button type="button" onClick={() => addNewsAsHypothesis(index)}>
                  <Plus size={15} />
                  轉假設
                </button>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          title="已保存情報"
          action={
            <span className="status-chip">
              <DatabaseZap size={14} />
              {intelligenceSources.length}
            </span>
          }
        >
          <div className="saved-source-list">
            {intelligenceSources.length === 0 ? (
              <div className="empty-state">你貼上的新聞、影片摘要、我幫你整理的金融資訊，之後都會留在這裡。</div>
            ) : (
              intelligenceSources.slice(0, 6).map((source) => (
                <article className="saved-source" key={source.id}>
                  <Video size={15} />
                  <div>
                    <strong>{source.title}</strong>
                    <span>{source.sourceType} · {source.horizonType} · 可信度 {source.reliability}/5</span>
                    <p>{source.summary}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
