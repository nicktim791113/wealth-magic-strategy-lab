import { createClient } from "@supabase/supabase-js";
import { cloudConfig, isCloudConfigured } from "./cloudConfig";

export const supabase = isCloudConfigured
  ? createClient(cloudConfig.supabaseUrl, cloudConfig.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;
