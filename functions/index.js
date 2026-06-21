const admin = require("firebase-admin");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

admin.initializeApp();

const githubToken = defineSecret("GITHUB_ACTIONS_TOKEN");

exports.triggerRefresh = onCall({ cors: true, secrets: [githubToken] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "請先登入 Firebase。");
  }

  const token = githubToken.value();
  const repository = process.env.GITHUB_REPOSITORY || "nicktim791113/wealth-magic-strategy-lab";
  const workflowFile = sanitizeWorkflowFile(request.data?.workflowFile) || process.env.GITHUB_WORKFLOW_FILE || "deploy-pages.yml";
  const branch = process.env.GITHUB_BRANCH || "main";
  const reason = String(request.data?.reason || "manual-refresh-from-firebase").slice(0, 160);
  const actionsUrl = `https://github.com/${repository}/actions/workflows/${workflowFile}`;
  const dispatchUrl = `https://api.github.com/repos/${repository}/actions/workflows/${workflowFile}/dispatches`;
  const now = admin.firestore.FieldValue.serverTimestamp();

  if (!token) {
    throw new HttpsError("failed-precondition", "Cloud Function 尚未設定 GITHUB_ACTIONS_TOKEN。");
  }

  const jobRef = admin
    .firestore()
    .collection("users")
    .doc(request.auth.uid)
    .collection("refreshJobs")
    .doc();

  await jobRef.set({
    status: "queued",
    reason,
    workflowFile,
    githubRunUrl: actionsUrl,
    createdAt: now,
    updatedAt: now,
  });

  const response = await fetch(dispatchUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      ref: branch,
      inputs: { reason },
    }),
  });
  const responseText = await response.text();

  await jobRef.update({
    status: response.ok ? "triggered" : "error",
    githubStatus: response.status,
    githubResponse: responseText.slice(0, 4000),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  if (!response.ok) {
    throw new HttpsError("internal", `GitHub Actions trigger failed: ${response.status}`);
  }

  return {
    message: "已送出立即更新請求，GitHub Actions 會開始刷新資料並重新部署。",
    actionsUrl,
    jobId: jobRef.id,
  };
});

function sanitizeWorkflowFile(value) {
  if (typeof value !== "string") return "";
  return /^[A-Za-z0-9._-]+\.ya?ml$/.test(value) ? value : "";
}
