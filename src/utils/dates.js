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
