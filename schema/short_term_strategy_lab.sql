PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS market_sessions (
  session_id TEXT PRIMARY KEY,
  session_date TEXT NOT NULL,
  market TEXT NOT NULL CHECK (market IN ('TW', 'US', 'GLOBAL')),
  regime TEXT NOT NULL,
  index_snapshot_json TEXT NOT NULL,
  leading_themes_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS signals (
  signal_id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES market_sessions(session_id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('news', 'filing', 'technical', 'flow', 'earnings', 'manual')),
  source_name TEXT,
  source_url TEXT,
  market TEXT NOT NULL CHECK (market IN ('TW', 'US', 'GLOBAL')),
  ticker TEXT,
  company_name TEXT,
  theme TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('bullish', 'bearish', 'neutral')),
  strength_score INTEGER NOT NULL CHECK (strength_score BETWEEN 0 AND 100),
  confidence_score INTEGER NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS strategy_versions (
  strategy_id TEXT NOT NULL,
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  market_scope TEXT NOT NULL,
  theme TEXT NOT NULL,
  rule_json TEXT NOT NULL,
  sample_size INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  avg_gain_pct REAL NOT NULL DEFAULT 0,
  avg_loss_pct REAL NOT NULL DEFAULT 0,
  max_drawdown_pct REAL NOT NULL DEFAULT 0,
  false_signal_rate REAL NOT NULL DEFAULT 0,
  expectancy_pct REAL NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'watching' CHECK (status IN ('watching', 'active', 'paused', 'retired')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (strategy_id, version)
);

CREATE TABLE IF NOT EXISTS hypotheses (
  hypothesis_id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES market_sessions(session_id) ON DELETE SET NULL,
  strategy_id TEXT NOT NULL,
  strategy_version TEXT NOT NULL,
  market TEXT NOT NULL CHECK (market IN ('TW', 'US')),
  ticker TEXT NOT NULL,
  company_name TEXT,
  theme TEXT NOT NULL,
  signal_source TEXT NOT NULL,
  thesis TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('bullish', 'bearish', 'neutral')),
  horizon_days INTEGER NOT NULL CHECK (horizon_days BETWEEN 1 AND 60),
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  entry_rule TEXT NOT NULL,
  exit_rule TEXT NOT NULL,
  stop_rule TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'watching' CHECK (status IN ('watching', 'triggered', 'won', 'lost', 'expired')),
  actual_return_pct REAL,
  failure_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (strategy_id, strategy_version) REFERENCES strategy_versions(strategy_id, version)
);

CREATE TABLE IF NOT EXISTS simulated_trades (
  trade_id TEXT PRIMARY KEY,
  hypothesis_id TEXT REFERENCES hypotheses(hypothesis_id) ON DELETE SET NULL,
  market TEXT NOT NULL CHECK (market IN ('TW', 'US')),
  ticker TEXT NOT NULL,
  company_name TEXT,
  strategy_id TEXT NOT NULL,
  strategy_version TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('long', 'short')),
  entry_price REAL NOT NULL,
  target_price REAL NOT NULL,
  stop_price REAL NOT NULL,
  planned_risk_pct REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'target', 'stopped', 'manual_exit')),
  result_pct REAL,
  note TEXT,
  opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TEXT,
  FOREIGN KEY (strategy_id, strategy_version) REFERENCES strategy_versions(strategy_id, version)
);

CREATE TABLE IF NOT EXISTS reviews (
  review_id TEXT PRIMARY KEY,
  session_date TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('pre_market', 'live', 'post_market', 'weekly')),
  completed_task_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  error_taxonomy_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS score_snapshots (
  snapshot_id TEXT PRIMARY KEY,
  session_date TEXT NOT NULL,
  strategy_id TEXT NOT NULL,
  strategy_version TEXT NOT NULL,
  win_rate REAL NOT NULL,
  payoff_ratio REAL NOT NULL,
  expectancy_pct REAL NOT NULL,
  sample_confidence REAL NOT NULL,
  risk_penalty REAL NOT NULL,
  score INTEGER NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (strategy_id, strategy_version) REFERENCES strategy_versions(strategy_id, version)
);

CREATE TABLE IF NOT EXISTS intelligence_sources (
  source_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('news', 'video', 'filing', 'earnings_call', 'social', 'manual_note')),
  reliability INTEGER NOT NULL CHECK (reliability BETWEEN 1 AND 5),
  horizon_type TEXT NOT NULL CHECK (horizon_type IN ('short', 'swing', 'long')),
  tickers_json TEXT NOT NULL DEFAULT '[]',
  themes_json TEXT NOT NULL DEFAULT '[]',
  summary TEXT,
  raw_text TEXT NOT NULL,
  source_url TEXT
);

CREATE TABLE IF NOT EXISTS source_outcomes (
  outcome_id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES intelligence_sources(source_id) ON DELETE CASCADE,
  hypothesis_id TEXT REFERENCES hypotheses(hypothesis_id) ON DELETE SET NULL,
  result_status TEXT NOT NULL CHECK (result_status IN ('pending', 'won', 'lost', 'expired')),
  actual_return_pct REAL,
  reaction_days INTEGER,
  source_score_delta REAL NOT NULL DEFAULT 0,
  reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_signals_ticker_observed_at ON signals(ticker, observed_at);
CREATE INDEX IF NOT EXISTS idx_hypotheses_ticker_status ON hypotheses(ticker, status);
CREATE INDEX IF NOT EXISTS idx_hypotheses_strategy ON hypotheses(strategy_id, strategy_version);
CREATE INDEX IF NOT EXISTS idx_simulated_trades_status ON simulated_trades(status);
CREATE INDEX IF NOT EXISTS idx_score_snapshots_strategy_date ON score_snapshots(strategy_id, strategy_version, session_date);
CREATE INDEX IF NOT EXISTS idx_intelligence_sources_created_at ON intelligence_sources(created_at);
CREATE INDEX IF NOT EXISTS idx_source_outcomes_source ON source_outcomes(source_id);
