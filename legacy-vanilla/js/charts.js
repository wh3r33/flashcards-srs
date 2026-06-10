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
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const average = Math.round((total / days.length) * 10) / 10;
  container.innerHTML = `
    <div class="chart-summary">
      <span>7-day total</span>
      <strong>${total}</strong>
      <small>${average} / day</small>
    </div>
    <div class="chart-bars" role="list" aria-label="Повторы за последние семь дней">
      ${days.map((day) => {
        const height = Math.max(14, Math.round((day.count / max) * 128));
        return `
          <div class="chart-day" role="listitem" title="${day.label}: ${day.count}">
            <span class="bar-value">${day.count}</span>
            <span class="bar" style="height:${height}px" aria-hidden="true"></span>
            <span class="bar-label">${day.label}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}
