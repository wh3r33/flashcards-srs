import { supabase } from "../lib/supabaseClient";

export async function listDecks(search = "") {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  let query = supabase
    .from("decks")
    .select("*, cards(count)")
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false });
  if (search) query = query.ilike("name", `%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getDeck(id) {
  const { data, error } = await supabase.from("decks").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createDeck(payload, userId) {
  const { data, error } = await supabase
    .from("decks")
    .insert({ ...payload, user_id: userId, is_public: Boolean(payload.is_public) })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDeck(id, payload) {
  const { data, error } = await supabase.from("decks").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDeck(id) {
  const { error } = await supabase.from("decks").delete().eq("id", id);
  if (error) throw error;
}

export async function listPublicDecks(search = "") {
  let query = supabase
    .from("decks")
    .select("*, cards(count)")
    .eq("is_public", true)
    .order("created_at", { ascending: false });
  if (search) query = query.ilike("name", `%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function copyPublicDeck(deckId, userId) {
  const source = await getDeck(deckId);
  const { data: cards, error: cardsError } = await supabase.from("cards").select("*").eq("deck_id", deckId);
  if (cardsError) throw cardsError;
  const newDeck = await createDeck({
    name: `${source.name} (копия)`,
    description: source.description || "",
    is_public: false
  }, userId);

  const cardRows = (cards || []).map((card) => ({
    deck_id: newDeck.id,
    front: card.front,
    back: card.back,
    card_type: card.card_type,
    options: card.options,
    correct_answer: card.correct_answer,
    category: card.category,
    tags: card.tags,
    interval_days: 1,
    ease_factor: 2.5,
    next_review_at: new Date().toISOString()
  }));

  if (cardRows.length) {
    const { error } = await supabase.from("cards").insert(cardRows);
    if (error) throw error;
  }
  return newDeck;
}
