import { supabase } from "./supabaseClient.js";

export async function generateCards(text, amount) {
  const { data, error } = await supabase.functions.invoke("generate-cards", {
    body: { text, amount }
  });
  if (error) throw error;
  if (!data?.cards?.length) throw new Error("ИИ не вернул карточки");
  return data.cards;
}

export async function explainCard(card) {
  const { data, error } = await supabase.functions.invoke("explain-card", {
    body: { front: card.front, back: card.back }
  });
  if (error) throw error;
  if (!data?.explanation) throw new Error("ИИ не вернул объяснение");
  return data.explanation;
}
