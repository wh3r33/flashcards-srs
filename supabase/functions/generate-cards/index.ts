type GeneratedCard = {
  front: string;
  back: string;
  category?: string;
  tags?: string[];
  card_type?: "basic" | "reverse" | "multiple_choice" | "cloze";
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
    if (!apiKey) throw new Error("DEEPSEEK_API_KEY не настроен");

    const { text, amount } = await req.json();
    const count = [5, 10, 20].includes(Number(amount)) ? Number(amount) : 5;
    if (!text || String(text).trim().length < 20) throw new Error("Недостаточно текста");

    const prompt = `Ты создаешь учебные карточки на русском языке. Верни только JSON без markdown.
Схема: {"cards":[{"front":"...","back":"...","category":"...","tags":["..."],"card_type":"basic|reverse|multiple_choice|cloze"}]}
Количество карточек: ${count}.
Текст:
${String(text).slice(0, 12000)}`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: Deno.env.get("DEEPSEEK_MODEL") || "deepseek-chat",
        messages: [
          { role: "system", content: "Ты строгий генератор JSON для приложения карточек. Пиши все поля на русском языке." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4
      })
    });

    if (!response.ok) throw new Error(`DeepSeek вернул ошибку ${response.status}`);
    const completion = await response.json();
    const content = completion.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    const cards = normalizeCards(parsed.cards).slice(0, count);

    return json({ cards });
  } catch (error) {
    return json({ error: error.message || "Ошибка генерации" }, 500);
  }
});

function normalizeCards(cards: GeneratedCard[] = []) {
  const allowed = new Set(["basic", "reverse", "multiple_choice", "cloze"]);
  return cards
    .filter((card) => card.front && card.back)
    .map((card) => ({
      front: String(card.front).trim(),
      back: String(card.back).trim(),
      category: card.category ? String(card.category).trim() : "Общее",
      tags: Array.isArray(card.tags) ? card.tags.map(String).slice(0, 6) : [],
      card_type: allowed.has(String(card.card_type)) ? card.card_type : "basic"
    }));
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
