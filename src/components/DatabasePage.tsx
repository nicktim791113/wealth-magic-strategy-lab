import { Database, FileCode2, ListChecks } from "lucide-react";
import type { SchemaTable } from "../types";
import { Panel } from "./ui";

export function DatabasePage({ schemaTables }: { schemaTables: SchemaTable[] }) {
  return (
    <div className="database-page">
      <Panel
        title="資料庫欄位設計"
        action={
          <span className="status-chip">
            <Database size={14} />
            SQLite-first
          </span>
        }
      >
        <div className="schema-grid">
          {schemaTables.map((table) => (
            <article className="schema-table" key={table.name}>
              <header>
                <strong>{table.name}</strong>
                <span>{table.purpose}</span>
              </header>
              <div className="schema-fields">
                {table.fields.map((field) => (
                  <div className="schema-field" key={`${table.name}-${field.name}`}>
                    <code>{field.name}</code>
                    <span>{field.type}</span>
                    <p>{field.purpose}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <div className="formula-grid">
        <Panel title="MVP 功能清單">
          <div className="mvp-list">
            <div>
              <ListChecks size={16} />
              <span>每日市場總覽、候選標的、假設建立、結果標記。</span>
            </div>
            <div>
              <ListChecks size={16} />
              <span>策略排行用勝率、賺賠比、期望值、樣本信心與風險扣分排序。</span>
            </div>
            <div>
              <ListChecks size={16} />
              <span>模擬交易只在假設觸發後建立，並記錄停損、目標與結果。</span>
            </div>
            <div>
              <ListChecks size={16} />
              <span>每日復盤保留錯誤分類，作為下一版策略調整依據。</span>
            </div>
          </div>
        </Panel>
        <Panel title="交付檔案">
          <div className="delivery-list">
            <div>
              <FileCode2 size={16} />
              <span>docs/short-term-strategy-lab-spec.md</span>
            </div>
            <div>
              <FileCode2 size={16} />
              <span>schema/short_term_strategy_lab.sql</span>
            </div>
            <div>
              <FileCode2 size={16} />
              <span>src/lib/strategyScore.ts</span>
            </div>
            <div>
              <FileCode2 size={16} />
              <span>src/lib/seedData.ts</span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
