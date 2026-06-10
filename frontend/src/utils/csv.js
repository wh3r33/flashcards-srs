const HEADERS = ["front", "back", "category", "tags", "card_type"];

export function splitTags(value = "") {
  return String(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function tagsToText(tags) {
  return Array.isArray(tags) ? tags.join(", ") : "";
}

function csvEscape(value = "") {
  const text = Array.isArray(value) ? value.join(",") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function downloadFile(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCardsCsv(cards, deckName = "studyos") {
  const rows = [HEADERS.join(",")].concat(cards.map((card) => [
    card.front,
    card.back,
    card.category || "",
    card.tags || [],
    card.card_type || "basic"
  ].map(csvEscape).join(",")));
  downloadFile(`${deckName.replaceAll(/\W+/g, "_")}.csv`, rows.join("\n"), "text/csv;charset=utf-8");
}

export function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const parseLine = (line) => {
    const cells = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];
      if (char === '"' && quoted && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        cells.push(cell);
        cell = "";
      } else {
        cell += char;
      }
    }
    cells.push(cell);
    return cells;
  };
  const headers = parseLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]));
    return {
      front: row.front,
      back: row.back,
      category: row.category || null,
      tags: splitTags(row.tags),
      card_type: row.card_type || "basic"
    };
  }).filter((row) => row.front && row.back);
}
