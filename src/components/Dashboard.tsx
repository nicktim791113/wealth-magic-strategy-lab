import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Flame,
  ShieldCheck,
} from "lucide-react";
import type { Candidate, Hypothesis, MarketDataSnapshot, SimulatedTrade, StrategyMetric } from "../types";
import { calculateStrategyScore, formatMoney, formatPct, positionSize } from "../lib/strategyScore";
import { MarketBadge, Panel, ScorePill, ToneValue } from "./ui";

const reactionData = [
  { day: "T", ai: 0.3, event: 0.2, dividend: 0.1 },
  { day: "T+1", ai: 1.4, event: 0.8, dividend: 0.3 },
  { day: "T+2", ai: 2.7, event: 1.9, dividend: 0.6 },
  { day: "T+3", ai: 3.1, event: 2.6, dividend: 0.9 },
  { day: "T+5", ai: 2.4, event: 3.2, dividend: 1.2 },
  { day: "T+10", ai: 1.8, event: 2.1, dividend: 1.7 },
];

const factorData = [
  { name: "AI", value: 88 },
  { name: "半導體", value: 82 },
  { name: "散熱", value: 74 },
  { name: "電力", value: 71 },
  { name: "高股息", value: 57 },
];

export function Dashboard({
  candidates,
  hypotheses,
  strategies,
  trades,
  dataSnapshot,
  dataError,
  capital,
  riskPct,
  stopPct,
  onCapitalChange,
  onRiskPctChange,
  onStopPctChange,
  onQuickHypothesis,
}: {
  candidates: Candidate[];
  hypotheses: Hypothesis[];
  strategies: StrategyMetric[];
  trades: SimulatedTrade[];
  dataSnapshot: MarketDataSnapshot | null;
  dataError: string;
  capital: number;
  riskPct: number;
  stopPct: number;
  onCapitalChange: (value: number) => void;
  onRiskPctChange: (value: number) => void;
  onStopPctChange: (value: number) => void;
  onQuickHypothesis: (candidate: Candidate) => void;
}) {
  const activeExperiments = hypotheses.filter((item) => item.status === "watching" || item.status === "triggered");
  const completed = hypotheses.filter((item) => item.status === "won" || item.status === "lost");
  const hitRate =
    completed.length > 0 ? completed.filter((item) => item.status === "won").length / completed.length : 0.58;
  const risk = positionSize(capital, riskPct, stopPct);
  const rankedStrategies = strategies
    .map((strategy) => ({ strategy, score: calculateStrategyScore(strategy) }))
    .sort((a, b) => b.score.score - a.score.score)
    .slice(0, 3);

  return (
    <div className="dashboard-grid">
      <Panel
        title="市場狀態"
        action={
          <span className={`status-chip ${dataSnapshot ? "active" : "paused"}`} title={dataError || undefined}>
            <Activity size={14} />
            {dataSnapshot ? "每日資料已載入" : "示範資料"}
          </span>
        }
        className="regime-panel"
      >
        <div className="regime-layout">
          <div className="regime-score">
            <span>Regime</span>
            <strong>多頭輪動</strong>
            <p>AI 基建與半導體仍是主軸，VIX 低位但需防範急漲後轉震盪。</p>
          </div>
          <div className="factor-bars">
            <FactorBars data={factorData} />
          </div>
        </div>
      </Panel>

      <Panel title="今日候選清單" className="candidate-panel">
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>標的</th>
                <th>題材</th>
                <th>漲跌</th>
                <th>訊號</th>
                <th>量比</th>
                <th>來源</th>
                <th>分數</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td>
                    <div className="ticker-cell">
                      <MarketBadge market={candidate.market} />
                      <div>
                        <strong>{candidate.ticker}</strong>
                        <span>{candidate.name} · {candidate.price.toLocaleString("zh-TW")}</span>
                      </div>
                    </div>
                  </td>
                  <td>{candidate.theme}</td>
                  <td>{typeof candidate.changePct === "number" ? <ToneValue value={candidate.changePct} compact /> : "-"}</td>
                  <td>{candidate.technicalSignal}</td>
                  <td>{candidate.volumeRatio.toFixed(2)}x</td>
                  <td>
                    <span className="source-count">{candidate.sourceCount ?? 0} 則</span>
                  </td>
                  <td>
                    <ScorePill score={candidate.setupScore} />
                  </td>
                  <td>
                    <button className="icon-button" type="button" onClick={() => onQuickHypothesis(candidate)}>
                      <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="假設實驗看板" className="hypothesis-panel">
        <div className="hypothesis-list">
          {activeExperiments.slice(0, 4).map((item) => (
            <article className="hypothesis-row" key={item.id}>
              <div className={`status-dot ${item.status}`} />
              <div>
                <div className="row-title">
                  <strong>{item.ticker}</strong>
                  <span>{item.strategyId}</span>
                  <MarketBadge market={item.market} />
                </div>
                <p>{item.thesis}</p>
                <div className="row-meta">
                  <span>{item.horizonDays} 日</span>
                  <span>信心 {item.confidence}</span>
                  {typeof item.actualReturnPct === "number" ? <ToneValue value={item.actualReturnPct} compact /> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="策略排行榜" className="strategy-panel">
        <div className="strategy-stack">
          {rankedStrategies.map(({ strategy, score }) => (
            <article className="strategy-card" key={strategy.strategyId}>
              <div>
                <strong>{strategy.name}</strong>
                <span>{strategy.version} · {strategy.marketScope}</span>
              </div>
              <ScorePill score={score.score} />
              <div className="mini-stats">
                <span>勝率 {(score.winRate * 100).toFixed(0)}%</span>
                <span>期望 {formatPct(score.expectancyPct)}</span>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="事件反應曲線" className="chart-panel">
        <ReactionChart data={reactionData} />
      </Panel>

      <Panel title="風控與升級門檻" className="risk-panel">
        <div className="risk-grid">
          <label>
            <span>實驗資金</span>
            <input value={capital} type="number" min={10000} step={10000} onChange={(event) => onCapitalChange(Number(event.target.value))} />
          </label>
          <label>
            <span>單筆最大風險 {riskPct.toFixed(1)}%</span>
            <input value={riskPct} type="range" min={0.2} max={3} step={0.1} onChange={(event) => onRiskPctChange(Number(event.target.value))} />
          </label>
          <label>
            <span>停損距離 {stopPct.toFixed(1)}%</span>
            <input value={stopPct} type="range" min={1} max={15} step={0.5} onChange={(event) => onStopPctChange(Number(event.target.value))} />
          </label>
        </div>
        <div className="risk-result">
          <ShieldCheck size={20} />
          <div>
            <span>單筆最大虧損</span>
            <strong>NT$ {formatMoney(risk.maxLoss)}</strong>
          </div>
          <div>
            <span>建議部位上限</span>
            <strong>NT$ {formatMoney(risk.position)}</strong>
          </div>
        </div>
        <div className="rule-strip">
          <span>
            <Flame size={14} />
            樣本數 &lt; 30：只觀察
          </span>
          <span>
            <CircleDollarSign size={14} />
            期望值 &gt; 0：才升級
          </span>
          <span>
            <AlertTriangle size={14} />
            最大回撤超標：降級
          </span>
        </div>
      </Panel>

      <Panel title="模擬交易狀態" className="trade-panel">
        <div className="trade-summary">
          <div>
            <span>開放中</span>
            <strong>{trades.filter((trade) => trade.status === "open").length}</strong>
          </div>
          <div>
            <span>達標</span>
            <strong>{trades.filter((trade) => trade.status === "target").length}</strong>
          </div>
          <div>
            <span>假設命中率</span>
            <strong>{Math.round(hitRate * 100)}%</strong>
          </div>
        </div>
        <div className="review-line">
          <CheckCircle2 size={16} />
          今日先累積可驗證樣本，未達門檻不升級成真實短線部位。
        </div>
      </Panel>
    </div>
  );
}

function FactorBars({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div className="factor-list">
      {data.map((item) => (
        <div className="factor-row" key={item.name}>
          <span>{item.name}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${item.value}%` }} />
          </div>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function ReactionChart({
  data,
}: {
  data: Array<{ day: string; ai: number; event: number; dividend: number }>;
}) {
  const width = 680;
  const height = 240;
  const pad = { top: 24, right: 24, bottom: 34, left: 42 };
  const chartWidth = width - pad.left - pad.right;
  const chartHeight = height - pad.top - pad.bottom;
  const maxValue = 4;
  const series = [
    { key: "ai", label: "AI突破", color: "#1b8a8f" },
    { key: "event", label: "事件漂移", color: "#2e6bd9" },
    { key: "dividend", label: "高股息輪動", color: "#d9962e" },
  ] as const;

  const xFor = (index: number) => pad.left + (index / (data.length - 1)) * chartWidth;
  const yFor = (value: number) => pad.top + chartHeight - (value / maxValue) * chartHeight;

  return (
    <div className="reaction-chart-wrap">
      <svg className="reaction-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="event reaction chart">
        {[0, 1, 2, 3, 4].map((tick) => (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={yFor(tick)}
              y2={yFor(tick)}
              stroke="#eef1f4"
              strokeWidth="1"
            />
            <text x={pad.left - 12} y={yFor(tick) + 4} textAnchor="end">
              {tick}%
            </text>
          </g>
        ))}
        {data.map((point, index) => (
          <text x={xFor(index)} y={height - 10} textAnchor="middle" key={point.day}>
            {point.day}
          </text>
        ))}
        {series.map((line) => {
          const points = data.map((point, index) => `${xFor(index)},${yFor(point[line.key])}`).join(" ");
          return (
            <g key={line.key}>
              <polyline
                fill="none"
                stroke={line.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                points={points}
              />
              {data.map((point, index) => (
                <circle
                  key={`${line.key}-${point.day}`}
                  cx={xFor(index)}
                  cy={yFor(point[line.key])}
                  r="4"
                  fill="#fff"
                  stroke={line.color}
                  strokeWidth="2"
                />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="chart-legend">
        {series.map((line) => (
          <span key={line.key}>
            <i style={{ background: line.color }} />
            {line.label}
          </span>
        ))}
      </div>
    </div>
  );
}
