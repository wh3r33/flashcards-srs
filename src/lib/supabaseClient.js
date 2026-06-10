import { createClient } from "@supabase/supabase-js";

const CONFIG_ERROR_MESSAGE = "Supabase не подключен. Проверьте переменные окружения VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.";
const PLACEHOLDER_PATTERN = /your_project|your[-_]?supabase|your_/i;

const legacyConfig = globalThis.STUDYOS_LEGACY_CONFIG || {};
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || legacyConfig.SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || legacyConfig.SUPABASE_ANON_KEY || "";

function isValidSupabaseUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

function createMissingConfigClient() {
  const fail = () => Promise.reject(new Error(CONFIG_ERROR_MESSAGE));
  const builder = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    eq: () => builder,
    ilike: () => builder,
    contains: () => builder,
    lte: () => builder,
    gt: () => builder,
    gte: () => builder,
    order: () => builder,
    single: fail,
    then: (...args) => fail().then(...args),
    catch: (...args) => fail().catch(...args),
    finally: (...args) => fail().finally(...args)
  };

  return {
    auth: {
      getSession: fail,
      getUser: fail,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: fail,
      signInWithPassword: fail,
      signOut: fail
    },
    from: () => builder,
    functions: {
      invoke: fail
    }
  };
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl)
    && Boolean(supabaseAnonKey)
    && isValidSupabaseUrl(supabaseUrl)
    && !PLACEHOLDER_PATTERN.test(supabaseUrl)
    && !PLACEHOLDER_PATTERN.test(supabaseAnonKey);
}

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : createMissingConfigClient();

export { CONFIG_ERROR_MESSAGE };
