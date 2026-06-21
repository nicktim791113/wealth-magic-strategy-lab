export const cloudConfig = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL ?? "").trim(),
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim(),
  githubRepository:
    (import.meta.env.VITE_GITHUB_REPOSITORY ?? "").trim() || "nicktim791113/wealth-magic-strategy-lab",
  refreshWorkflowFile: (import.meta.env.VITE_REFRESH_WORKFLOW_FILE ?? "").trim() || "deploy-pages.yml",
};

export const isCloudConfigured = Boolean(cloudConfig.supabaseUrl && cloudConfig.supabaseAnonKey);
