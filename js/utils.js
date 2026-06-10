export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function splitTags(value = "") {
  return String(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function tagsToText(tags) {
  return Array.isArray(tags) ? tags.join(", ") : "";
}

export function todayIso() {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now.toISOString();
}

export function startOfWeekIso() {
  const now = new Date();
  const day = now.getDay() || 7;
  now.setDate(now.getDate() - day + 1);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export function daysAgoIso(days) {
  const now = new Date();
  now.setDate(now.getDate() - days);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
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

export function setMessage(node, text, kind = "") {
  if (!node) return;
  node.textContent = text || "";
  node.className = `message ${kind}`.trim();
  node.classList.toggle("hidden", !text);
}

export function formDataObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

export function requireConfigNotice() {
  return `<div class="message danger">Supabase не подключён. Проверьте js/config.js</div>`;
}
