import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const CONFIG_ERROR_MESSAGE = "Supabase не подключён. Проверьте js/config.js";
const PLACEHOLDER_PATTERN = /your_project|your[-_]?supabase|your_/i;

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
  return Boolean(SUPABASE_URL)
    && Boolean(SUPABASE_ANON_KEY)
    && isValidSupabaseUrl(SUPABASE_URL)
    && !PLACEHOLDER_PATTERN.test(SUPABASE_URL)
    && !PLACEHOLDER_PATTERN.test(SUPABASE_ANON_KEY);
}

export const supabase = isSupabaseConfigured() ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}) : createMissingConfigClient();
