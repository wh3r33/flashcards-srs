export function renderReviewsChart(container, reviews) {
  const days = [...Array(7)].map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("ru-RU", { weekday: "short" }),
      count: 0
    };
  });
  for (const review of reviews) {
    const key = new Date(review.reviewed_at).toISOString().slice(0, 10);
    const day = days.find((item) => item.key === key);
    if (day) day.count += 1;
  }
  const max = Math.max(1, ...days.map((day) => day.count));
  container.innerHTML = days.map((day) => {
    const height = Math.max(8, Math.round((day.count / max) * 120));
    return `<div class="bar" style="height:${height}px" title="${day.label}: ${day.count}">${day.count}<br>${day.label}</div>`;
  }).join("");
}
