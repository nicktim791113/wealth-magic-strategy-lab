import { CheckCircle2, Circle, Clock3, FileText, Gauge } from "lucide-react";
import type { WorkflowTask } from "../types";
import { Panel } from "./ui";

export function ReviewPage({
  workflowTasks,
  checkedTasks,
  notes,
  onToggleTask,
  onNotesChange,
}: {
  workflowTasks: WorkflowTask[];
  checkedTasks: Record<string, boolean>;
  notes: string;
  onToggleTask: (id: string) => void;
  onNotesChange: (notes: string) => void;
}) {
  const phases: WorkflowTask["phase"][] = ["盤前", "盤中", "盤後", "週檢討"];
  const completed = workflowTasks.filter((item) => checkedTasks[item.id]).length;

  return (
    <div className="review-page">
      <Panel
        title="每日操作流程"
        action={
          <span className="status-chip active">
            <Gauge size={14} />
            {completed}/{workflowTasks.length}
          </span>
        }
      >
        <div className="workflow-lanes">
          {phases.map((phase) => (
            <section className="workflow-lane" key={phase}>
              <header>
                <Clock3 size={15} />
                <strong>{phase}</strong>
              </header>
              {workflowTasks
                .filter((item) => item.phase === phase)
                .map((task) => (
                  <button className="task-row" type="button" key={task.id} onClick={() => onToggleTask(task.id)}>
                    {checkedTasks[task.id] ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    <span>{task.label}</span>
                  </button>
                ))}
            </section>
          ))}
        </div>
      </Panel>

      <div className="review-grid">
        <Panel title="今日復盤紀錄">
          <div className="note-editor">
            <FileText size={18} />
            <textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} />
          </div>
        </Panel>
        <Panel title="錯誤分類">
          <div className="error-taxonomy">
            <span>資訊錯：消息被市場提前反映</span>
            <span>時機錯：方向對但進場過早</span>
            <span>價格錯：突破品質不足或追高</span>
            <span>紀律錯：未照出場條件執行</span>
            <span>環境錯：市場 regime 已改變</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}
