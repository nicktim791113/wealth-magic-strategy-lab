import {
  Bot,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  MessageSquareText,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { Panel } from "./ui";

const dailyFlow = [
  {
    phase: "盤前資料刷新",
    owner: "Codex 主要執行",
    detail: "刷新行情與新聞資料，檢查資料來源狀態，整理今日候選清單與主要題材。",
    command: "npm run refresh:data",
  },
  {
    phase: "情報分析",
    owner: "Codex 主要執行",
    detail: "閱讀自動挖掘新聞、你提供的資訊或金融影片摘要，抽出題材、標的、時間週期與可驗證論點。",
  },
  {
    phase: "建立假設",
    owner: "Codex 主要執行，你可微調",
    detail: "把資訊轉成假設實驗，寫清進場條件、出場條件、撤退條件與驗證天數。",
  },
  {
    phase: "你看資料",
    owner: "你主要負責",
    detail: "查看今日市場、情報來源、假設草稿與策略排行榜；如果你有偏好或不認同的地方，再讓我調整。",
  },
  {
    phase: "盤後復盤",
    owner: "Codex 主要執行",
    detail: "標記假設成立/失敗/過期，整理錯誤原因，更新來源可靠性與策略方向。",
  },
];

const userInputs = [
  "把新聞、文章、截圖或影片重點貼到「情報來源」，我會轉成假設草稿。",
  "告訴我你今天想偏重短線、波段、長線、高股息、AI、半導體或風險觀察。",
  "看到候選清單時，你只需要說保留、排除、加強分析或改成長線驗證。",
  "如果你想要我主動跑流程，可以直接說：幫我做今天盤前更新。",
];

const codexCommands = [
  "幫我刷新今日資料並解讀候選清單",
  "把這段影片重點轉成假設實驗",
  "分析今天自動挖掘新聞哪些值得追蹤",
  "幫我做盤後復盤，哪些假設成立或失敗",
  "檢查策略排行榜，淘汰低品質來源或策略",
];

export function GuidePage() {
  return (
    <div className="guide-page">
      <Panel
        title="協作模式"
        action={
          <span className="status-chip active">
            <Bot size={14} />
            Codex 主動操作
          </span>
        }
      >
        <div className="guide-hero">
          <div>
            <h2>這套軟體不是要你每天手動研究全部資料。</h2>
            <p>
              主要流程由 Codex 執行：我負責刷新資料、挖掘新聞、分析資訊、建立假設、整理復盤與提出下一步。
              你主要負責看結果、調整偏好、補充資訊，並決定哪些方向值得繼續追蹤。
            </p>
          </div>
          <div className="guide-command-card">
            <span>每天可以直接對我說</span>
            <strong>幫我做今天盤前更新</strong>
            <p>我會依照這個工作台的流程刷新資料、查看新聞、整理候選與建立假設草稿。</p>
          </div>
        </div>
      </Panel>

      <Panel title="每日流程">
        <div className="guide-flow">
          {dailyFlow.map((item, index) => (
            <article className="guide-step" key={item.phase}>
              <div className="step-index">{index + 1}</div>
              <div>
                <header>
                  <strong>{item.phase}</strong>
                  <span>{item.owner}</span>
                </header>
                <p>{item.detail}</p>
                {item.command ? <code>{item.command}</code> : null}
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <div className="guide-grid">
        <Panel title="你主要看這些">
          <div className="guide-list">
            <GuideItem icon={<Eye size={16} />} title="今日市場" text="看市場狀態、候選清單、分數與來源數。" />
            <GuideItem icon={<FileText size={16} />} title="情報來源" text="看自動新聞原始摘要，或貼上影片/文章內容。" />
            <GuideItem icon={<ClipboardList size={16} />} title="假設實驗" text="看我整理出的假設、週期、證據與驗證狀態。" />
            <GuideItem icon={<SlidersHorizontal size={16} />} title="策略排行榜" text="看哪些策略與資訊來源的勝率、期望值較好。" />
          </div>
        </Panel>

        <Panel title="你可以怎麼給我資訊">
          <div className="guide-list">
            {userInputs.map((text) => (
              <GuideItem icon={<CheckCircle2 size={16} />} title="可操作輸入" text={text} key={text} />
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="可以直接叫我做的事">
        <div className="prompt-strip">
          {codexCommands.map((command) => (
            <div className="prompt-chip" key={command}>
              <MessageSquareText size={15} />
              <span>{command}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="guide-grid">
        <Panel title="更新新聞與行情">
          <div className="guide-callout">
            <RefreshCw size={18} />
            <div>
              <strong>手動更新指令</strong>
              <code>npm run refresh:data</code>
              <p>更新後重新整理瀏覽器，就會看到新的自動挖掘新聞、行情與候選清單。</p>
            </div>
          </div>
        </Panel>

        <Panel title="投資方向如何融入">
          <div className="guide-callout">
            <Sparkles size={18} />
            <div>
              <strong>短線、波段、長線一起驗證</strong>
              <p>
                高股息是現金流假設，AI/半導體/資料中心是成長假設，新聞與事件是短線假設。
                它們會進同一個實驗流程，但用不同驗證天數和出場條件追蹤。
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function GuideItem({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="guide-item">
      {icon}
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </article>
  );
}
