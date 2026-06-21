export const cloudConfig = {
  firebase: {
    apiKey: (import.meta.env.VITE_FIREBASE_API_KEY ?? "").trim(),
    authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "").trim(),
    projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "").trim(),
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "").trim(),
    messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "").trim(),
    appId: (import.meta.env.VITE_FIREBASE_APP_ID ?? "").trim(),
    measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "").trim() || undefined,
  },
  firebaseFunctionsRegion: (import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION ?? "").trim() || "us-central1",
  githubRepository:
    (import.meta.env.VITE_GITHUB_REPOSITORY ?? "").trim() || "nicktim791113/wealth-magic-strategy-lab",
  refreshWorkflowFile: (import.meta.env.VITE_REFRESH_WORKFLOW_FILE ?? "").trim() || "deploy-pages.yml",
};

export const isCloudConfigured = Boolean(
  cloudConfig.firebase.apiKey &&
    cloudConfig.firebase.authDomain &&
    cloudConfig.firebase.projectId &&
    cloudConfig.firebase.appId,
);
