import { CheckCircle2, CircleStop, Plus, XCircle } from "lucide-react";
import type { Hypothesis, SimulatedTrade } from "../types";
import { formatPct } from "../lib/strategyScore";
import { MarketBadge, Panel, ToneValue } from "./ui";

const statusText: Record<SimulatedTrade["status"], string> = {
  open: "開放",
  target: "達標",
  stopped: "停損",
  manual_exit: "手動出場",
};

export function TradePage({
  trades,
  hypotheses,
  onCreateTrade,
  onUpdateTrade,
}: {
  trades: SimulatedTrade[];
  hypotheses: Hypothesis[];
  onCreateTrade: (hypothesis: Hypothesis) => void;
  onUpdateTrade: (id: string, patch: Partial<SimulatedTrade>) => void;
}) {
  const tradeable = hypotheses.filter((item) => item.status === "watching" || item.status === "triggered");

  return (
    <div className="trade-page">
      <Panel title="可轉模擬交易的假設">
        <div className="quick-trade-list">
          {tradeable.map((item) => (
            <article key={item.id} className="quick-trade-item">
              <div>
                <div className="row-title">
                  <strong>{item.ticker}</strong>
                  <span>{item.name}</span>
                  <MarketBadge market={item.market} />
                </div>
                <p>{item.entryRule}</p>
              </div>
              <button className="primary-button" type="button" onClick={() => onCreateTrade(item)}>
                <Plus size={15} />
                建倉
              </button>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="模擬交易紀錄">
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>標的</th>
                <th>策略</th>
                <th>進場</th>
                <th>目標</th>
                <th>停損</th>
                <th>計畫風險</th>
                <th>結果</th>
                <th>狀態</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id}>
                  <td>
                    <div className="ticker-cell">
                      <MarketBadge market={trade.market} />
                      <div>
                        <strong>{trade.ticker}</strong>
                        <span>{trade.name}</span>
                      </div>
                    </div>
                  </td>
                  <td>{trade.strategyId}</td>
                  <td>{trade.entryPrice.toFixed(2)}</td>
                  <td>{trade.targetPrice.toFixed(2)}</td>
                  <td>{trade.stopPrice.toFixed(2)}</td>
                  <td>{trade.plannedRiskPct.toFixed(2)}%</td>
                  <td>{typeof trade.resultPct === "number" ? <ToneValue value={trade.resultPct} compact /> : "追蹤中"}</td>
                  <td>
                    <span className={`trade-status ${trade.status}`}>{statusText[trade.status]}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button type="button" onClick={() => onUpdateTrade(trade.id, { status: "target", resultPct: 3.2 })}>
                        <CheckCircle2 size={15} />
                      </button>
                      <button type="button" onClick={() => onUpdateTrade(trade.id, { status: "stopped", resultPct: -1.6 })}>
                        <CircleStop size={15} />
                      </button>
                      <button type="button" onClick={() => onUpdateTrade(trade.id, { status: "manual_exit", resultPct: 0.4 })}>
                        <XCircle size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="短線交易前檢查">
        <div className="pretrade-grid">
          <div>
            <strong>可做</strong>
            <span>策略分數 ≥ 62、樣本 ≥ 30、期望值為正、停損位置清楚。</span>
          </div>
          <div>
            <strong>只模擬</strong>
            <span>樣本不足、題材剛出現、或尚未證明在當前市場狀態有效。</span>
          </div>
          <div>
            <strong>禁止</strong>
            <span>沒有撤退條件、只因消息追高、或部位大小會讓單筆虧損超過規則。</span>
          </div>
          <div>
            <strong>結果格式</strong>
            <span>每筆交易至少記錄 {formatPct(0)}、觸發時間、錯誤原因與策略版本。</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
