import {
  Cloud,
  DatabaseZap,
  GitBranch,
  LogIn,
  LogOut,
  RefreshCw,
  Save,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { cloudConfig, isCloudConfigured } from "../lib/cloudConfig";
import { useCloudSession } from "../lib/useCloudSession";
import type { Hypothesis, IntelligenceSource, SimulatedTrade } from "../types";
import { Panel } from "./ui";

interface CloudPageProps {
  hypotheses: Hypothesis[];
  trades: SimulatedTrade[];
  intelligenceSources: IntelligenceSource[];
  checkedTasks: Record<string, boolean>;
  reviewNotes: string;
  capital: number;
  riskPct: number;
  stopPct: number;
  onRestore: (payload: CloudSnapshotPayload) => void;
}

export interface CloudSnapshotPayload {
  hypotheses?: Hypothesis[];
  trades?: SimulatedTrade[];
  intelligenceSources?: IntelligenceSource[];
  checkedTasks?: Record<string, boolean>;
  reviewNotes?: string;
  capital?: number;
  riskPct?: number;
  stopPct?: number;
  savedAt?: string;
}

interface RefreshJob {
  id: string;
  status: string;
  reason: string | null;
  github_run_url: string | null;
  created_at: string;
}

export function CloudPage({
  hypotheses,
  trades,
  intelligenceSources,
  checkedTasks,
  reviewNotes,
  capital,
  riskPct,
  stopPct,
  onRestore,
}: CloudPageProps) {
  const { session, loading, supabase } = useCloudSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [jobs, setJobs] = useState<RefreshJob[]>([]);
  const [lastSnapshotAt, setLastSnapshotAt] = useState("");

  const snapshotPayload = useMemo<CloudSnapshotPayload>(
    () => ({
      hypotheses,
      trades,
      intelligenceSources,
      checkedTasks,
      reviewNotes,
      capital,
      riskPct,
      stopPct,
      savedAt: new Date().toISOString(),
    }),
    [capital, checkedTasks, hypotheses, intelligenceSources, reviewNotes, riskPct, stopPct, trades],
  );

  useEffect(() => {
    if (!session || !supabase) return;
    void refreshCloudState();
  }, [session, supabase]);

  async function signInOrUp() {
    if (!supabase) return;
    setBusy(true);
    setMessage("");

    const authCall =
      mode === "sign-up"
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password });
    const { error } = await authCall;

    setBusy(false);
    setMessage(error ? error.message : mode === "sign-up" ? "帳號已建立，若 Supabase 要求驗證信箱，請先完成驗證。" : "已登入雲端實驗室。");
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setJobs([]);
    setLastSnapshotAt("");
    setMessage("已登出。");
  }

  async function refreshCloudState() {
    if (!supabase || !session) return;

    const [{ data: jobRows }, { data: snapshotRows }] = await Promise.all([
      supabase
        .from("refresh_jobs")
        .select("id,status,reason,github_run_url,created_at")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("lab_snapshots")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    setJobs((jobRows ?? []) as RefreshJob[]);
    setLastSnapshotAt(snapshotRows?.[0]?.created_at ?? "");
  }

  async function syncToCloud() {
    if (!supabase || !session) return;
    setBusy(true);
    setMessage("");

    const profileResult = await supabase.from("profiles").upsert({
      id: session.user.id,
      email: session.user.email,
      updated_at: new Date().toISOString(),
    });
    const snapshotResult = await supabase.from("lab_snapshots").insert({
      user_id: session.user.id,
      snapshot_type: "manual-sync",
      payload: snapshotPayload,
    });

    setBusy(false);

    if (profileResult.error || snapshotResult.error) {
      setMessage(profileResult.error?.message ?? snapshotResult.error?.message ?? "同步失敗。");
      return;
    }

    setMessage("已把目前實驗室資料同步到雲端資料庫。");
    await refreshCloudState();
  }

  async function restoreLatestSnapshot() {
    if (!supabase || !session) return;
    setBusy(true);
    setMessage("");

    const { data, error } = await supabase
      .from("lab_snapshots")
      .select("payload,created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setBusy(false);

    if (error || !data?.payload) {
      setMessage(error?.message ?? "目前沒有可還原的雲端快照。");
      return;
    }

    onRestore(data.payload as CloudSnapshotPayload);
    setMessage(`已還原 ${formatDateTime(data.created_at)} 的雲端快照。`);
    await refreshCloudState();
  }

  async function triggerRefresh() {
    if (!supabase || !session) return;
    setBusy(true);
    setMessage("");

    const { data, error } = await supabase.functions.invoke("trigger-refresh", {
      body: {
        reason: "manual-refresh-from-cloud-page",
        workflowFile: cloudConfig.refreshWorkflowFile,
      },
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(data?.message ?? "已送出立即更新請求，GitHub Actions 會開始刷新資料並重新部署。");
    await refreshCloudState();
  }

  if (!isCloudConfigured) {
    return <CloudSetupGuide />;
  }

  if (loading) {
    return (
      <div className="cloud-page">
        <Panel title="雲端實驗室">
          <div className="empty-state">正在讀取登入狀態...</div>
        </Panel>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="cloud-page">
        <CloudHero />
        <Panel title="登入雲端實驗室" action={<span className="status-chip paused">需要登入</span>}>
          <div className="cloud-auth-form">
            <label>
              <span>Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </label>
            <label>
              <span>Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="至少 6 位數"
                type="password"
              />
            </label>
            <div className="segmented-control">
              <button className={mode === "sign-in" ? "active" : ""} type="button" onClick={() => setMode("sign-in")}>
                登入
              </button>
              <button className={mode === "sign-up" ? "active" : ""} type="button" onClick={() => setMode("sign-up")}>
                建立帳號
              </button>
            </div>
            <button className="primary-button" disabled={busy || !email || !password} type="button" onClick={signInOrUp}>
              <LogIn size={15} />
              {busy ? "處理中" : mode === "sign-up" ? "建立帳號" : "登入"}
            </button>
            {message ? <p className="cloud-message">{message}</p> : null}
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="cloud-page">
      <CloudHero />

      <div className="cloud-grid">
        <Panel title="帳號與資料庫" action={<span className="status-chip active">已登入</span>}>
          <div className="cloud-card-list">
            <CloudInfo icon={<ShieldCheck size={16} />} label="登入帳號" value={session.user.email ?? session.user.id} />
            <CloudInfo icon={<DatabaseZap size={16} />} label="Supabase" value={cloudConfig.supabaseUrl} />
            <CloudInfo icon={<Save size={16} />} label="最近雲端快照" value={lastSnapshotAt ? formatDateTime(lastSnapshotAt) : "尚未同步"} />
          </div>
          <div className="cloud-actions">
            <button className="primary-button" disabled={busy} type="button" onClick={syncToCloud}>
              <UploadCloud size={15} />
              同步到雲端
            </button>
            <button className="secondary-button" disabled={busy} type="button" onClick={restoreLatestSnapshot}>
              <DatabaseZap size={15} />
              還原最新快照
            </button>
            <button className="secondary-button" disabled={busy} type="button" onClick={signOut}>
              <LogOut size={15} />
              登出
            </button>
          </div>
        </Panel>

        <Panel title="立即更新" action={<span className="status-chip">GitHub Actions</span>}>
          <div className="cloud-refresh-box">
            <GitBranch size={18} />
            <div>
              <strong>{cloudConfig.githubRepository}</strong>
              <span>Workflow: {cloudConfig.refreshWorkflowFile}</span>
              <p>按下後會透過 Supabase Edge Function 觸發 GitHub Actions，重新抓行情、新聞並部署 GitHub Pages。</p>
            </div>
          </div>
          <div className="cloud-actions">
            <button className="primary-button" disabled={busy} type="button" onClick={triggerRefresh}>
              <RefreshCw size={15} />
              {busy ? "送出中" : "立即更新"}
            </button>
            <button className="secondary-button" disabled={busy} type="button" onClick={refreshCloudState}>
              查看狀態
            </button>
          </div>
        </Panel>
      </div>

      <Panel title="更新請求紀錄">
        {jobs.length ? (
          <div className="cloud-job-list">
            {jobs.map((job) => (
              <article className="cloud-job" key={job.id}>
                <div>
                  <strong>{job.status}</strong>
                  <span>{formatDateTime(job.created_at)}</span>
                </div>
                <p>{job.reason ?? "manual refresh"}</p>
                {job.github_run_url ? (
                  <a href={job.github_run_url} rel="noreferrer" target="_blank">
                    打開 GitHub Actions
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">尚未有雲端更新紀錄。</div>
        )}
      </Panel>

      {message ? <div className="cloud-toast">{message}</div> : null}
    </div>
  );
}

function CloudSetupGuide() {
  return (
    <div className="cloud-page">
      <CloudHero />
      <Panel title="第二階段尚未啟用" action={<span className="status-chip paused">等待 Supabase 設定</span>}>
        <div className="cloud-setup">
          <p>目前網站仍會維持第一階段展示模式。建立 Supabase 專案並把下列 secrets 加到 GitHub 後，登入、資料庫與立即更新按鈕就會啟用。</p>
          <code>VITE_SUPABASE_URL</code>
          <code>VITE_SUPABASE_ANON_KEY</code>
          <code>GITHUB_ACTIONS_TOKEN</code>
          <code>SUPABASE_SERVICE_ROLE_KEY</code>
        </div>
      </Panel>
    </div>
  );
}

function CloudHero() {
  return (
    <Panel title="雲端投資實驗室" action={<span className="status-chip"><Cloud size={14} /> Phase 2</span>}>
      <div className="cloud-hero">
        <div>
          <h2>把策略實驗、個人資料與更新操作搬到雲端</h2>
          <p>登入後可以把本機實驗室快照同步到資料庫，也可以用「立即更新」從遠端觸發行情與新聞刷新。</p>
        </div>
        <div className="cloud-mini-flow">
          <span>Supabase Auth</span>
          <span>Postgres RLS</span>
          <span>Edge Function</span>
          <span>GitHub Actions</span>
        </div>
      </div>
    </Panel>
  );
}

function CloudInfo({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <article className="cloud-info">
      {icon}
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function formatDateTime(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Taipei",
  }).format(new Date(value));
}
