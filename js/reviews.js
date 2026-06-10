import { supabase } from "./supabaseClient.js";
import { calculateNextReview } from "./srs.js";
import { daysAgoIso, startOfWeekIso, todayIso } from "./utils.js";

export async function reviewCard(card, rating) {
  const { error: reviewError } = await supabase.from("reviews").insert({ card_id: card.id, rating });
  if (reviewError) throw reviewError;
  const update = calculateNextReview(card, rating);
  const { data, error } = await supabase.from("cards").update(update).eq("id", card.id).select().single();
  if (error) throw error;
  return data;
}

export async function dashboardStats() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const userId = authData.user.id;
  const due = await supabase.from("cards").select("id, decks!inner(user_id)", { count: "exact", head: true }).eq("decks.user_id", userId).lte("next_review_at", todayIso());
  const decks = await supabase.from("decks").select("id", { count: "exact", head: true }).eq("user_id", userId);
  const cards = await supabase.from("cards").select("id, decks!inner(user_id)", { count: "exact", head: true }).eq("decks.user_id", userId);
  const week = await supabase.from("reviews").select("rating, reviewed_at").gte("reviewed_at", startOfWeekIso());
  const learned = await supabase.from("cards").select("id, decks!inner(user_id)", { count: "exact", head: true }).eq("decks.user_id", userId).gt("interval_days", 1);
  const totalReviews = await supabase.from("reviews").select("id", { count: "exact", head: true });
  const recent = await supabase.from("reviews").select("rating, reviewed_at").gte("reviewed_at", daysAgoIso(6));

  for (const result of [due, decks, cards, week, learned, totalReviews, recent]) {
    if (result.error) throw result.error;
  }

  const weekReviews = week.data || [];
  const correct = weekReviews.filter((item) => item.rating !== "again").length;
  const accuracy = weekReviews.length ? Math.round((correct / weekReviews.length) * 100) : 0;

  return {
    dueToday: due.count || 0,
    totalDecks: decks.count || 0,
    totalCards: cards.count || 0,
    reviewedWeek: weekReviews.length,
    accuracy,
    learned: learned.count || 0,
    totalReviews: totalReviews.count || 0,
    recentReviews: recent.data || []
  };
}
