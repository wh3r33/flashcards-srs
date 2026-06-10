import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Button from "../components/Button";
import StatCard from "../components/StatCard";
import LoadingState from "../components/LoadingState";
import { dashboardStats } from "../services/reviewService";
import { toRussianError } from "../utils/errors";

function ReviewsChart({ reviews }) {
  const days = [...Array(7)].map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("ru-RU", { weekday: "short" }),
      count: 0
    };
  });
  for (const review of reviews || []) {
    const key = new Date(review.reviewed_at).toISOString().slice(0, 10);
    const day = days.find((item) => item.key === key);
    if (day) day.count += 1;
  }
  const max = Math.max(1, ...days.map((day) => day.count));
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const average = Math.round((total / days.length) * 10) / 10;
  return (
    <>
      <div className="chart-summary"><span>Итого за 7 дней</span><strong>{total}</strong><small>{average} в день</small></div>
      <div className="chart-bars" role="list" aria-label="Повторы за последние семь дней">
        {days.map((day) => (
          <div className="chart-day" role="listitem" title={`${day.label}: ${day.count}`} key={day.key}>
            <span className="bar-value">{day.count}</span>
            <span className="bar" style={{ height: `${Math.max(14, Math.round((day.count / max) * 128))}px` }} aria-hidden="true"></span>
            <span className="bar-label">{day.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardStats().then(setStats).catch((err) => setError(toRussianError(err, "Не удалось загрузить статистику.")));
  }, []);

  const statCards = stats && [
    ["К сроку сегодня", stats.dueToday, "featured stat-due", "bookmark-red", "Повторить сейчас", "Ближайшие карточки для тренировки."],
    ["Точность", `${stats.accuracy}%`, "stat-accuracy", "bookmark-green", "Качество ответов", "Доля уверенных ответов в журнале."],
    ["Неделя", `${stats.reviewedWeek}`, "stat-week", "bookmark-blue", "Ритм за неделю", "Повторы за последние семь дней."],
    ["Выучено", stats.learned, "stat-learned", "bookmark-gold", "Долгая память", "Карточки, закрепленные в памяти."],
    ["Карточек", stats.totalCards, "stat-cards", "bookmark-red", "Объем архива", "Все учебные записи в системе."],
    ["Колоды", stats.totalDecks, "stat-decks", "bookmark-green", "Блокноты", "Отдельные коллекции знаний."],
    ["Повторов", stats.totalReviews, "stat-reviews", "bookmark-blue", "История", "Все сделанные повторения."]
  ];

  return (
    <Layout title="Журнал памяти" activeTitle="Обзор">
      <div className="dashboard-hero">
        <div>
          <div className="eyebrow">Сегодня в архиве</div>
          <h1 className="page-title">Память становится системой.</h1>
          <p className="page-copy">Здесь видно, что повторить сегодня, как меняется точность и сколько знаний уже закреплено.</p>
        </div>
        <div className="row">
          <Button as={Link} to="/training/all">Начать тренировку</Button>
          <Button as={Link} to="/decks">Колоды</Button>
        </div>
      </div>
      {error && <div className="message danger">{error}</div>}
      {!stats && !error && <LoadingState>Загружаю статистику...</LoadingState>}
      {stats && (
        <div className="dashboard-grid journal-grid">
          <div className="journal-metrics">
            {statCards.map(([label, value, variant, tone, kicker, caption]) => (
              <StatCard key={label} label={label} value={value} variant={variant} tone={tone} kicker={kicker} caption={caption} />
            ))}
          </div>
          <div className="panel chart-panel">
            <div className="eyebrow">Ритм повторений</div>
            <h2>Последние семь дней</h2>
            <p className="muted">Регулярность важнее рывков. График показывает, когда вы действительно возвращались к карточкам.</p>
            <div className="chart"><ReviewsChart reviews={stats.recentReviews} /></div>
          </div>
        </div>
      )}
    </Layout>
  );
}
