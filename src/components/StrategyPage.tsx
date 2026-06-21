import { BadgeCheck, ChevronDown, ChevronUp, PauseCircle } from "lucide-react";
import type { StrategyMetric } from "../types";
import { calculateStrategyScore, formatPct } from "../lib/strategyScore";
import { Panel, ScorePill } from "./ui";

export function StrategyPage({ strategies }: { strategies: StrategyMetric[] }) {
  const ranked = strategies
    .map((strategy) => ({ strategy, score: calculateStrategyScore(strategy) }))
    .sort((a, b) => b.score.score - a.score.score);

  return (
    <div className="strategy-page">
      <Panel title="策略排行榜">
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>策略</th>
                <th>市場</th>
                <th>週期</th>
                <th>樣本</th>
                <th>勝率</th>
                <th>賺賠比</th>
                <th>期望值</th>
                <th>風險扣分</th>
                <th>總分</th>
                <th>狀態</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ strategy, score }) => (
                <tr key={strategy.strategyId}>
                  <td>
                    <div className="ticker-cell">
                      <div className="strategy-icon">{score.grade}</div>
                      <div>
                        <strong>{strategy.name}</strong>
                        <span>{strategy.strategyId} · {strategy.version} · {strategy.theme}</span>
                      </div>
                    </div>
                  </td>
                  <td>{strategy.marketScope}</td>
                  <td>{strategy.horizon ?? "短線"}</td>
                  <td>{strategy.sampleSize}</td>
                  <td>{(score.winRate * 100).toFixed(0)}%</td>
                  <td>{score.payoffRatio.toFixed(2)}</td>
                  <td>{formatPct(score.expectancyPct)}</td>
                  <td>{score.riskPenalty.toFixed(1)}</td>
                  <td>
                    <ScorePill score={score.score} />
                  </td>
                  <td>
                    <span className={`status-chip ${strategy.active ? "active" : "paused"}`}>
                      {strategy.active ? <BadgeCheck size={14} /> : <PauseCircle size={14} />}
                      {strategy.active ? "主測" : "觀察"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="formula-grid">
        <Panel title="策略評分公式">
          <div className="formula-block">
            <code>期望值 = 勝率 × 平均獲利 - 失敗率 × 平均虧損</code>
            <code>樣本信心 = min(樣本數 / 50, 1)</code>
            <code>風險扣分 = 最大回撤 × 0.42 + 錯誤訊號率 × 8</code>
            <code>總分 = (期望值 × 14 + 勝率 × 34 + 賺賠比 × 12) × 樣本信心 - 風險扣分</code>
          </div>
        </Panel>
        <Panel title="升級 / 降級規則">
          <div className="upgrade-rules">
            <div>
              <ChevronUp size={16} />
              <span>樣本數 ≥ 30、期望值為正、最大回撤低於門檻，升級為主測策略。</span>
            </div>
            <div>
              <ChevronDown size={16} />
              <span>連續 10 筆期望值轉負、錯誤訊號率升高，降級為觀察策略。</span>
            </div>
            <div>
              <PauseCircle size={16} />
              <span>市場 regime 改變時，暫停舊版本並建立新版本重新驗證。</span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
