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
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { cloudConfig, isCloudConfigured } from "../lib/cloudConfig";
import { cloudFunctions, firestore } from "../lib/firebaseClient";
import { useFirebaseSession } from "../lib/useFirebaseSession";
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
  reason: string;
  githubRunUrl: string;
  workflowFile: string;
  createdAt?: Timestamp;
}

interface TriggerRefreshResult {
  message?: string;
  actionsUrl?: string;
  jobId?: string;
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
  const { user, loading, auth } = useFirebaseSession();
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
    if (!user || !firestore) return;
    void refreshCloudState(user.uid);
  }, [user]);

  async function signInOrUp() {
    if (!auth) return;
    setBusy(true);
    setMessage("");

    try {
      const credential =
        mode === "sign-up"
          ? await createUserWithEmailAndPassword(auth, email, password)
          : await signInWithEmailAndPassword(auth, email, password);

      if (firestore) {
        await setDoc(
          doc(firestore, "users", credential.user.uid),
          {
            email: credential.user.email,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true },
        );
      }

      setMessage(mode === "sign-up" ? "帳號已建立，已登入雲端實驗室。" : "已登入雲端實驗室。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登入失敗。");
    } finally {
      setBusy(false);
    }
  }

  async function signOutCloud() {
    if (!auth) return;
    await signOut(auth);
    setJobs([]);
    setLastSnapshotAt("");
    setMessage("已登出。");
  }

  async function refreshCloudState(uid = user?.uid) {
    if (!firestore || !uid) return;

    const [jobRows, snapshotRows] = await Promise.all([
      getDocs(query(collection(firestore, "users", uid, "refreshJobs"), orderBy("createdAt", "desc"), limit(6))),
      getDocs(query(collection(firestore, "users", uid, "labSnapshots"), orderBy("createdAt", "desc"), limit(1))),
    ]);

    setJobs(
      jobRows.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<RefreshJob, "id">),
      })),
    );

    const latestSnapshot = snapshotRows.docs[0]?.data();
    setLastSnapshotAt(formatCloudDate(latestSnapshot?.createdAt));
  }

  async function syncToCloud() {
    if (!firestore || !user) return;
    setBusy(true);
    setMessage("");

    try {
      await setDoc(
        doc(firestore, "users", user.uid),
        {
          email: user.email,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      await addDoc(collection(firestore, "users", user.uid, "labSnapshots"), {
        snapshotType: "manual-sync",
        payload: snapshotPayload,
        createdAt: serverTimestamp(),
      });
      setMessage("已把目前實驗室資料同步到 Firebase Firestore。");
      await refreshCloudState(user.uid);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "同步失敗。");
    } finally {
      setBusy(false);
    }
  }

  async function restoreLatestSnapshot() {
    if (!firestore || !user) return;
    setBusy(true);
    setMessage("");

    try {
      const snapshots = await getDocs(
        query(collection(firestore, "users", user.uid, "labSnapshots"), orderBy("createdAt", "desc"), limit(1)),
      );
      const latest = snapshots.docs[0]?.data();

      if (!latest?.payload) {
        setMessage("目前沒有可還原的 Firebase 快照。");
        return;
      }

      onRestore(latest.payload as CloudSnapshotPayload);
      setMessage(`已還原 ${formatCloudDate(latest.createdAt)} 的雲端快照。`);
      await refreshCloudState(user.uid);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "還原失敗。");
    } finally {
      setBusy(false);
    }
  }

  async function triggerRefresh() {
    if (!cloudFunctions || !user) return;
    setBusy(true);
    setMessage("");

    try {
      const triggerRefreshFn = httpsCallable<
        { reason: string; workflowFile: string },
        TriggerRefreshResult
      >(cloudFunctions, "triggerRefresh");
      const result = await triggerRefreshFn({
        reason: "manual-refresh-from-firebase-cloud-page",
        workflowFile: cloudConfig.refreshWorkflowFile,
      });

      setMessage(result.data.message ?? "已送出立即更新請求。");
      await refreshCloudState(user.uid);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "立即更新失敗。");
    } finally {
      setBusy(false);
    }
  }

  if (!isCloudConfigured) {
    return <CloudSetupGuide />;
  }

  if (loading) {
    return (
      <div className="cloud-page">
        <Panel title="雲端實驗室">
          <div className="empty-state">正在讀取 Firebase 登入狀態...</div>
        </Panel>
      </div>
    );
  }

  if (!user) {
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
            <CloudInfo icon={<ShieldCheck size={16} />} label="登入帳號" value={user.email ?? user.uid} />
            <CloudInfo icon={<DatabaseZap size={16} />} label="Firebase project" value={cloudConfig.firebase.projectId} />
            <CloudInfo icon={<Save size={16} />} label="最近雲端快照" value={lastSnapshotAt || "尚未同步"} />
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
            <button className="secondary-button" disabled={busy} type="button" onClick={signOutCloud}>
              <LogOut size={15} />
              登出
            </button>
          </div>
        </Panel>

        <Panel title="立即更新" action={<span className="status-chip">Firebase Functions</span>}>
          <div className="cloud-refresh-box">
            <GitBranch size={18} />
            <div>
              <strong>{cloudConfig.githubRepository}</strong>
              <span>Workflow: {cloudConfig.refreshWorkflowFile}</span>
              <p>按下後會透過 Firebase Cloud Function 觸發 GitHub Actions，重新抓行情、新聞並部署 GitHub Pages。</p>
            </div>
          </div>
          <div className="cloud-actions">
            <button className="primary-button" disabled={busy} type="button" onClick={triggerRefresh}>
              <RefreshCw size={15} />
              {busy ? "送出中" : "立即更新"}
            </button>
            <button className="secondary-button" disabled={busy} type="button" onClick={() => refreshCloudState()}>
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
                  <span>{formatCloudDate(job.createdAt)}</span>
                </div>
                <p>{job.reason || "manual refresh"}</p>
                {job.githubRunUrl ? (
                  <a href={job.githubRunUrl} rel="noreferrer" target="_blank">
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
      <Panel title="第二階段尚未啟用" action={<span className="status-chip paused">等待 Firebase 設定</span>}>
        <div className="cloud-setup">
          <p>目前網站仍會維持第一階段展示模式。建立 Firebase 專案並把下列 secrets 加到 GitHub 後，登入、資料庫與立即更新按鈕就會啟用。</p>
          <code>VITE_FIREBASE_API_KEY</code>
          <code>VITE_FIREBASE_AUTH_DOMAIN</code>
          <code>VITE_FIREBASE_PROJECT_ID</code>
          <code>VITE_FIREBASE_APP_ID</code>
          <code>GITHUB_ACTIONS_TOKEN</code>
        </div>
      </Panel>
    </div>
  );
}

function CloudHero() {
  return (
    <Panel title="雲端投資實驗室" action={<span className="status-chip"><Cloud size={14} /> Firebase</span>}>
      <div className="cloud-hero">
        <div>
          <h2>把策略實驗、個人資料與更新操作搬到 Firebase</h2>
          <p>登入後可以把本機實驗室快照同步到 Firestore，也可以用「立即更新」從遠端觸發行情與新聞刷新。</p>
        </div>
        <div className="cloud-mini-flow">
          <span>Firebase Auth</span>
          <span>Firestore Rules</span>
          <span>Cloud Functions</span>
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

function formatCloudDate(value: unknown) {
  if (!value) return "";
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return formatDateTime(value.toDate());
  }
  if (value instanceof Date || typeof value === "string") {
    return formatDateTime(new Date(value));
  }
  return "";
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Taipei",
  }).format(value);
}
