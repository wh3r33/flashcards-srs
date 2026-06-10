import { supabase } from "../lib/supabaseClient";

export async function generateCardsFromText(text, amount) {
  const body = {
    text: String(text || "").trim(),
    amount: Number(amount)
  };

  console.log("generate-cards outgoing body:", body);

  const { data, error } = await supabase.functions.invoke("generate-cards", {
    body
  });

  const functionError = error ? await readFunctionError(error) : "";

  console.log("generate-cards returned data:", data);
  console.log("generate-cards returned error:", functionError || error);

  if (error) {
    throw new Error(functionError || data?.error || error.message || "Ошибка Edge Function");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.cards?.length) {
    throw new Error("ИИ не вернул карточки");
  }

  return data.cards;
}

async function readFunctionError(error) {
  const response = error?.context;
  if (!response || typeof response.clone !== "function") return "";

  try {
    const payload = await response.clone().json();
    if (payload?.error) return String(payload.error);
    if (payload?.message) return String(payload.message);
    return JSON.stringify(payload);
  } catch {
    try {
      return await response.clone().text();
    } catch {
      return "";
    }
  }
}

export async function explainCard(front, back) {
  const { data, error } = await supabase.functions.invoke("explain-card", {
    body: { front, back }
  });

  if (error) throw new Error(data?.error || error.message);
  if (!data?.explanation) throw new Error(data?.error || "ИИ не вернул объяснение");

  return data.explanation;
}
