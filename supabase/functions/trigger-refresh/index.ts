import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ message: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const githubToken = Deno.env.get("GITHUB_ACTIONS_TOKEN") ?? "";
  const githubRepository = Deno.env.get("GITHUB_REPOSITORY") ?? "nicktim791113/wealth-magic-strategy-lab";
  const defaultWorkflowFile = Deno.env.get("GITHUB_WORKFLOW_FILE") ?? "deploy-pages.yml";
  const branch = Deno.env.get("GITHUB_BRANCH") ?? "main";

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !githubToken) {
    return json({ message: "Cloud refresh is not configured. Missing Supabase or GitHub secrets." }, 500);
  }

  const authorization = request.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: userData, error: userError } = await userClient.auth.getUser();

  if (userError || !userData.user) {
    return json({ message: "Unauthorized" }, 401);
  }

  const body = await request.json().catch(() => ({}));
  const workflowFile = sanitizeWorkflowFile(body.workflowFile) || defaultWorkflowFile;
  const reason = String(body.reason ?? "manual-refresh").slice(0, 160);
  const dispatchUrl = `https://api.github.com/repos/${githubRepository}/actions/workflows/${workflowFile}/dispatches`;
  const actionsUrl = `https://github.com/${githubRepository}/actions/workflows/${workflowFile}`;

  const response = await fetch(dispatchUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubToken}`,
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
  const status = response.ok ? "triggered" : "error";

  await adminClient.from("refresh_jobs").insert({
    user_id: userData.user.id,
    status,
    reason,
    github_run_url: actionsUrl,
    workflow_file: workflowFile,
    response: {
      githubStatus: response.status,
      githubResponse: responseText,
    },
  });

  if (!response.ok) {
    return json(
      {
        message: "GitHub Actions trigger failed.",
        githubStatus: response.status,
        githubResponse: responseText,
      },
      502,
    );
  }

  return json({
    message: "已送出立即更新請求，GitHub Actions 會開始刷新資料並重新部署。",
    actionsUrl,
  });
});

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function sanitizeWorkflowFile(value: unknown) {
  if (typeof value !== "string") return "";
  return /^[A-Za-z0-9._-]+\.ya?ml$/.test(value) ? value : "";
}
