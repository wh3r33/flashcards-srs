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

    const { front, back } = await req.json();
    if (!front || !back) throw new Error("Нет данных карточки");

    const prompt = `Объясни тему карточки на русском языке.
Вопрос: ${front}
Ответ: ${back}

Структура ответа:
Простое объяснение:
Пример:
Частая ошибка:
Как запомнить:`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: Deno.env.get("DEEPSEEK_MODEL") || "deepseek-chat",
        messages: [
          { role: "system", content: "Ты терпеливый преподаватель. Отвечай кратко, ясно и только на русском языке." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) throw new Error(`DeepSeek вернул ошибку ${response.status}`);
    const completion = await response.json();
    const explanation = completion.choices?.[0]?.message?.content?.trim();
    return json({ explanation });
  } catch (error) {
    return json({ error: error.message || "Ошибка объяснения" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
