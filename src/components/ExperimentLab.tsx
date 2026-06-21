import { Plus, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import type { Candidate, Direction, ExperimentStatus, Hypothesis, StrategyMetric } from "../types";
import { today } from "../lib/seedData";
import { MarketBadge, Panel, ToneValue } from "./ui";

const statusLabels: Record<ExperimentStatus, string> = {
  watching: "觀察",
  triggered: "觸發",
  won: "成立",
  lost: "失敗",
  expired: "過期",
};

export function ExperimentLab({
  hypotheses,
  strategies,
  candidates,
  onAdd,
  onUpdate,
  onCreateTrade,
}: {
  hypotheses: Hypothesis[];
  strategies: StrategyMetric[];
  candidates: Candidate[];
  onAdd: (hypothesis: Hypothesis) => void;
  onUpdate: (id: string, patch: Partial<Hypothesis>) => void;
  onCreateTrade: (hypothesis: Hypothesis) => void;
}) {
  const [market, setMarket] = useState<"ALL" | "TW" | "US">("ALL");
  const filtered = useMemo(
    () => hypotheses.filter((item) => market === "ALL" || item.market === market),
    [hypotheses, market],
  );

  return (
    <div className="two-column-page">
      <Panel title="建立今日假設" className="form-panel">
        <HypothesisForm candidates={candidates} strategies={strategies} onAdd={onAdd} />
      </Panel>
      <Panel
        title="假設清單"
        action={
          <div className="segmented-control">
            {(["ALL", "TW", "US"] as const).map((item) => (
              <button className={market === item ? "active" : ""} key={item} type="button" onClick={() => setMarket(item)}>
                {item === "ALL" ? "全部" : item === "TW" ? "台股" : "美股"}
              </button>
            ))}
          </div>
        }
        className="list-panel"
      >
        <div className="experiment-list">
          {filtered.map((item) => (
            <article className="experiment-item" key={item.id}>
              <header>
                <div>
                  <div className="row-title">
                    <strong>{item.ticker}</strong>
                    <span>{item.name}</span>
                    <MarketBadge market={item.market} />
                  </div>
                  <p>{item.thesis}</p>
                </div>
                <span className={`status-label ${item.status}`}>{statusLabels[item.status]}</span>
              </header>
              <div className="experiment-rules">
                <span>進場：{item.entryRule}</span>
                <span>出場：{item.exitRule}</span>
                <span>撤退：{item.stopRule}</span>
              </div>
              <footer>
                <div className="row-meta">
                  <span>{item.strategyId}</span>
                  <span>{item.theme}</span>
                  <span>{item.horizonDays} 日</span>
                  <span>信心 {item.confidence}</span>
                  {typeof item.actualReturnPct === "number" ? <ToneValue value={item.actualReturnPct} compact /> : null}
                </div>
                <div className="button-row">
                  <button type="button" onClick={() => onUpdate(item.id, { status: "triggered" })}>
                    觸發
                  </button>
                  <button type="button" onClick={() => onUpdate(item.id, { status: "won", actualReturnPct: 2.8 })}>
                    成立
                  </button>
                  <button type="button" onClick={() => onUpdate(item.id, { status: "lost", actualReturnPct: -1.4 })}>
                    失敗
                  </button>
                  <button type="button" onClick={() => onCreateTrade(item)}>
                    建模擬倉
                  </button>
                </div>
              </footer>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function HypothesisForm({
  candidates,
  strategies,
  onAdd,
}: {
  candidates: Candidate[];
  strategies: StrategyMetric[];
  onAdd: (hypothesis: Hypothesis) => void;
}) {
  const [candidateId, setCandidateId] = useState(candidates[0]?.id ?? "");
  const selected = candidates.find((candidate) => candidate.id === candidateId) ?? candidates[0];
  const [direction, setDirection] = useState<Direction>("bullish");
  const [strategyId, setStrategyId] = useState(strategies[0]?.strategyId ?? "");
  const [horizonDays, setHorizonDays] = useState(3);
  const [confidence, setConfidence] = useState(65);
  const [thesis, setThesis] = useState("題材訊號與量價結構同步轉強，預期短期反應優於大盤。");
  const [entryRule, setEntryRule] = useState("收盤突破關鍵價且量比 > 1.3");
  const [exitRule, setExitRule] = useState("達目標報酬或時間到期");
  const [stopRule, setStopRule] = useState("跌破觸發 K 低點或 -2.5%");

  function submit() {
    if (!selected) return;
    onAdd({
      id: `hyp-${Date.now()}`,
      date: today,
      market: selected.market,
      ticker: selected.ticker,
      name: selected.name,
      strategyId,
      theme: selected.theme,
      signalSource: `${selected.catalyst} / ${selected.technicalSignal}`,
      thesis,
      direction,
      horizonDays,
      confidence,
      entryRule,
      exitRule,
      stopRule,
      status: "watching",
    });
  }

  return (
    <div className="hypothesis-form">
      <label>
        <span>候選標的</span>
        <select value={candidateId} onChange={(event) => setCandidateId(event.target.value)}>
          {candidates.map((candidate) => (
            <option value={candidate.id} key={candidate.id}>
              {candidate.ticker} · {candidate.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>策略版本</span>
        <select value={strategyId} onChange={(event) => setStrategyId(event.target.value)}>
          {strategies.map((strategy) => (
            <option value={strategy.strategyId} key={strategy.strategyId}>
              {strategy.strategyId} · {strategy.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>方向</span>
        <select value={direction} onChange={(event) => setDirection(event.target.value as Direction)}>
          <option value="bullish">看多</option>
          <option value="bearish">看空</option>
          <option value="neutral">盤整</option>
        </select>
      </label>
      <label>
        <span>驗證天數</span>
        <input value={horizonDays} min={1} max={1095} type="number" onChange={(event) => setHorizonDays(Number(event.target.value))} />
      </label>
      <label>
        <span>信心分數 {confidence}</span>
        <input value={confidence} min={1} max={100} type="range" onChange={(event) => setConfidence(Number(event.target.value))} />
      </label>
      <label className="full-span">
        <span>假設</span>
        <textarea value={thesis} onChange={(event) => setThesis(event.target.value)} />
      </label>
      <label className="full-span">
        <span>進場條件</span>
        <input value={entryRule} onChange={(event) => setEntryRule(event.target.value)} />
      </label>
      <label className="full-span">
        <span>出場條件</span>
        <input value={exitRule} onChange={(event) => setExitRule(event.target.value)} />
      </label>
      <label className="full-span">
        <span>撤退條件</span>
        <input value={stopRule} onChange={(event) => setStopRule(event.target.value)} />
      </label>
      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={() => setThesis("題材訊號與量價結構同步轉強，預期短期反應優於大盤。")}>
          <RotateCcw size={15} />
          重置
        </button>
        <button className="primary-button" type="button" onClick={submit}>
          <Plus size={16} />
          加入實驗
        </button>
      </div>
    </div>
  );
}
