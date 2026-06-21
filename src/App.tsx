import {
  BarChart3,
  BookOpenCheck,
  CandlestickChart,
  ClipboardCheck,
  Database,
  FlaskConical,
  LineChart,
  RadioTower,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { DatabasePage } from "./components/DatabasePage";
import { ExperimentLab } from "./components/ExperimentLab";
import { GuidePage } from "./components/GuidePage";
import { IntelligencePage } from "./components/IntelligencePage";
import { MarketTape } from "./components/MarketTape";
import { ReviewPage } from "./components/ReviewPage";
import { StrategyPage } from "./components/StrategyPage";
import { TradePage } from "./components/TradePage";
import { usePersistentState } from "./lib/usePersistentState";
import {
  candidates as seedCandidates,
  initialHypotheses,
  initialTrades,
  marketIndexes as seedMarketIndexes,
  schemaTables,
  strategies,
  today,
  workflowTasks,
} from "./lib/seedData";
import type {
  Candidate,
  Hypothesis,
  IntelligenceSource,
  MarketDataSnapshot,
  NavItem,
  SectionKey,
  SimulatedTrade,
} from "./types";

const navItems: NavItem[] = [
  { key: "dashboard", label: "今日市場", icon: BarChart3 },
  { key: "intelligence", label: "情報來源", icon: RadioTower },
  { key: "experiments", label: "假設實驗", icon: FlaskConical },
  { key: "strategies", label: "策略排行榜", icon: Trophy },
  { key: "trades", label: "模擬交易", icon: CandlestickChart },
  { key: "review", label: "復盤中心", icon: ClipboardCheck },
  { key: "database", label: "資料庫", icon: Database },
  { key: "guide", label: "使用說明", icon: BookOpenCheck },
];

const reviewSeed =
  "今日觀察：\n1. 哪個訊號最接近預期？\n2. 哪個策略失效？\n3. 明天要保留、調整或淘汰哪個假設？";

function App() {
  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");
  const [hypotheses, setHypotheses] = usePersistentState<Hypothesis[]>(
    "wm.hypotheses.v1",
    initialHypotheses,
  );
  const [trades, setTrades] = usePersistentState<SimulatedTrade[]>("wm.trades.v1", initialTrades);
  const [checkedTasks, setCheckedTasks] = usePersistentState<Record<string, boolean>>("wm.workflow.v1", {});
  const [reviewNotes, setReviewNotes] = usePersistentState("wm.reviewNotes.v1", reviewSeed);
  const [capital, setCapital] = usePersistentState("wm.capital.v1", 1_000_000);
  const [riskPct, setRiskPct] = usePersistentState("wm.riskPct.v1", 1);
  const [stopPct, setStopPct] = usePersistentState("wm.stopPct.v1", 8);
  const [intelligenceSources, setIntelligenceSources] = usePersistentState<IntelligenceSource[]>(
    "wm.intelligenceSources.v1",
    [],
  );
  const [marketData, setMarketData] = useState<MarketDataSnapshot | null>(null);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const dataUrl = `${import.meta.env.BASE_URL}data/market-lab-latest.json`;

    fetch(dataUrl, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<MarketDataSnapshot>;
      })
      .then((data) => {
        if (!cancelled) {
          setMarketData(data);
          setDataError("");
        }
      })
      .catch((error: Error) => {
        if (!cancelled) setDataError(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const liveCandidates = marketData?.candidates ?? seedCandidates;
  const liveMarketIndexes = marketData?.marketIndexes ?? seedMarketIndexes;

  const headerStats = useMemo(() => {
    const live = hypotheses.filter((item) => item.status === "watching" || item.status === "triggered").length;
    const won = hypotheses.filter((item) => item.status === "won").length;
    const lost = hypotheses.filter((item) => item.status === "lost").length;
    const completed = won + lost;
    return {
      live,
      hitRate: completed > 0 ? Math.round((won / completed) * 100) : 58,
      simulatedOpen: trades.filter((trade) => trade.status === "open").length,
    };
  }, [hypotheses, trades]);

  function addHypothesis(hypothesis: Hypothesis) {
    setHypotheses((current) => [hypothesis, ...current]);
  }

  function updateHypothesis(id: string, patch: Partial<Hypothesis>) {
    setHypotheses((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addQuickHypothesis(candidate: Candidate) {
    const strategyId = candidate.theme.includes("股息")
      ? "S-DIV-ROT"
      : candidate.horizonType === "長線"
        ? "S-LONG-AI"
      : candidate.market === "US"
        ? "S-EVENT-DRIFT"
        : "S-AI-MOM";
    const horizonDays = candidate.horizonType === "長線" ? 180 : candidate.horizonType === "波段" ? 20 : 3;

    addHypothesis({
      id: `hyp-${Date.now()}`,
      date: today,
      market: candidate.market,
      ticker: candidate.ticker,
      name: candidate.name,
      strategyId,
      theme: candidate.theme,
      signalSource: `${candidate.catalyst} / ${candidate.technicalSignal}`,
      thesis: `若 ${candidate.theme} 題材延續且 ${candidate.technicalSignal} 成立，${candidate.expectedHorizon} 內預期強於同市場指數。`,
      direction: "bullish",
      horizonDays,
      confidence: candidate.setupScore,
      entryRule: `${candidate.technicalSignal} 且量比維持 > 1.2`,
      exitRule: "達成目標報酬、時間到期或族群強度轉弱",
      stopRule: "跌破觸發價或單筆風險超過規則",
      status: "watching",
      horizonType: candidate.horizonType,
      portfolioRole: candidate.theme.includes("股息") ? "現金流" : candidate.horizonType === "長線" ? "資產成長" : "短線交易",
      evidence: candidate.newsDigest?.join(" / ") ?? candidate.catalyst,
    });
    setActiveSection("experiments");
  }

  function createTradeFromHypothesis(hypothesis: Hypothesis) {
    const candidate = liveCandidates.find((item) => item.ticker === hypothesis.ticker);
    const entryPrice = candidate?.price ?? 100;
    const isShort = hypothesis.direction === "bearish";
    const targetPrice = isShort ? entryPrice * 0.96 : entryPrice * 1.04;
    const stopPrice = isShort ? entryPrice * 1.025 : entryPrice * 0.975;

    setTrades((current) => [
      {
        id: `trade-${Date.now()}`,
        date: today,
        market: hypothesis.market,
        ticker: hypothesis.ticker,
        name: hypothesis.name,
        strategyId: hypothesis.strategyId,
        side: isShort ? "short" : "long",
        entryPrice,
        targetPrice,
        stopPrice,
        plannedRiskPct: riskPct,
        status: "open",
        note: hypothesis.thesis,
      },
      ...current,
    ]);
    updateHypothesis(hypothesis.id, { status: "triggered" });
    setActiveSection("trades");
  }

  function updateTrade(id: string, patch: Partial<SimulatedTrade>) {
    setTrades((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function toggleTask(id: string) {
    setCheckedTasks((current) => ({ ...current, [id]: !current[id] }));
  }

  function addIntelligenceSource(source: IntelligenceSource) {
    setIntelligenceSources((current) => [source, ...current]);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <LineChart size={22} />
          </div>
          <div>
            <strong>致富魔法</strong>
            <span>短線策略實驗室</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={activeSection === item.key ? "active" : ""}
                type="button"
                key={item.key}
                onClick={() => setActiveSection(item.key)}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-meter">
          <span>今日實驗</span>
          <strong>{headerStats.live}</strong>
          <p>開放假設正在等待觸發或驗證。</p>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="date-chip">{today}</span>
            <h1>{navItems.find((item) => item.key === activeSection)?.label}</h1>
          </div>
          <div className="topbar-stats">
            <div>
              <span>假設命中</span>
              <strong>{headerStats.hitRate}%</strong>
            </div>
            <div>
              <span>開放交易</span>
              <strong>{headerStats.simulatedOpen}</strong>
            </div>
          </div>
        </header>

        {activeSection !== "guide" ? <MarketTape indexes={liveMarketIndexes} /> : null}

        {activeSection === "dashboard" ? (
          <Dashboard
            candidates={liveCandidates}
            hypotheses={hypotheses}
            strategies={strategies}
            trades={trades}
            dataSnapshot={marketData}
            dataError={dataError}
            capital={capital}
            riskPct={riskPct}
            stopPct={stopPct}
            onCapitalChange={setCapital}
            onRiskPctChange={setRiskPct}
            onStopPctChange={setStopPct}
            onQuickHypothesis={addQuickHypothesis}
          />
        ) : null}

        {activeSection === "intelligence" ? (
          <IntelligencePage
            candidates={liveCandidates}
            strategies={strategies}
            snapshot={marketData}
            dataError={dataError}
            intelligenceSources={intelligenceSources}
            onAddSource={addIntelligenceSource}
            onAddHypothesis={addHypothesis}
          />
        ) : null}

        {activeSection === "experiments" ? (
          <ExperimentLab
            hypotheses={hypotheses}
            strategies={strategies}
            candidates={liveCandidates}
            onAdd={addHypothesis}
            onUpdate={updateHypothesis}
            onCreateTrade={createTradeFromHypothesis}
          />
        ) : null}

        {activeSection === "strategies" ? <StrategyPage strategies={strategies} /> : null}

        {activeSection === "trades" ? (
          <TradePage
            trades={trades}
            hypotheses={hypotheses}
            onCreateTrade={createTradeFromHypothesis}
            onUpdateTrade={updateTrade}
          />
        ) : null}

        {activeSection === "review" ? (
          <ReviewPage
            workflowTasks={workflowTasks}
            checkedTasks={checkedTasks}
            notes={reviewNotes}
            onToggleTask={toggleTask}
            onNotesChange={setReviewNotes}
          />
        ) : null}

        {activeSection === "database" ? <DatabasePage schemaTables={schemaTables} /> : null}

        {activeSection === "guide" ? <GuidePage /> : null}
      </main>
    </div>
  );
}

export default App;
