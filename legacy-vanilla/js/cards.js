import { supabase } from "./supabaseClient.js";

export async function listCards(deckId, filters = {}) {
  let query = supabase.from("cards").select("*").eq("deck_id", deckId).order("created_at", { ascending: false });
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.tag) query = query.contains("tags", [filters.tag]);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createCard(payload) {
  const { data, error } = await supabase
    .from("cards")
    .insert({
      ...payload,
      interval_days: payload.interval_days || 1,
      ease_factor: payload.ease_factor || 2.5,
      next_review_at: payload.next_review_at || new Date().toISOString()
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createCards(rows) {
  if (!rows.length) return [];
  const { data, error } = await supabase.from("cards").insert(rows).select();
  if (error) throw error;
  return data || [];
}

export async function updateCard(id, payload) {
  const { data, error } = await supabase.from("cards").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCard(id) {
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) throw error;
}

export async function dueCards(deckId = null) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Нужен вход в аккаунт");
  let query = supabase
    .from("cards")
    .select("*, decks!inner(id, name, user_id)")
    .eq("decks.user_id", authData.user.id)
    .lte("next_review_at", new Date().toISOString())
    .order("next_review_at", { ascending: true });
  if (deckId) query = query.eq("deck_id", deckId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
