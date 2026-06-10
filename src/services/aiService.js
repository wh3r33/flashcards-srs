import { supabase } from "../lib/supabaseClient";

export async function generateCardsFromText(text, amount, deckId) {
  const body = {
    text: String(text || "").trim(),
    amount: Number(amount),
    deckId
  };

  console.log("generate-cards body:", body);

  const { data, error } = await supabase.functions.invoke("generate-cards", {
    body
  });

  console.log("generate-cards result:", { data, error });

  if (error) {
    throw new Error(data?.error || error.message || "Ошибка Edge Function");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.cards?.length) {
    throw new Error("ИИ не вернул карточки");
  }

  return data.cards;
}

export async function explainCard(front, back) {
  const { data, error } = await supabase.functions.invoke("explain-card", {
    body: { front, back }
  });

  if (error) throw new Error(data?.error || error.message);
  if (!data?.explanation) throw new Error(data?.error || "ИИ не вернул объяснение");

  return data.explanation;
}