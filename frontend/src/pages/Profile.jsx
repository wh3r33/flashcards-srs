import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import AvatarUploader from "../components/AvatarUploader";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../App";
import { dashboardStats } from "../services/reviewService";
import { toRussianError } from "../utils/errors";

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardStats().then(setStats).catch((err) => setError(toRussianError(err, "Не удалось загрузить профиль обучения.")));
  }, []);

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("studyos-theme", next);
  }

  return (
    <Layout title="Профиль обучения" activeTitle="Профиль">
      <div className="profile-hero">
        <div>
          <div className="eyebrow">Учебный профиль</div>
          <h1 className="page-title">Ваш стол внутри картотеки.</h1>
          <p className="page-copy">Аватар, серия, достижения и рост знаний собраны как персональное учебное пространство.</p>
        </div>
      </div>
      <div className="profile-grid">
        <AvatarUploader user={user} />
        <section className="panel">
          <div className="eyebrow">Учебный след</div>
          <h2>Профиль коллекции</h2>
          <div className="profile-stats">
            {error && <div className="message danger">{error}</div>}
            {!stats && !error && <LoadingState>Загружаю статистику...</LoadingState>}
            {stats && [
              ["Точность", `${stats.accuracy}%`, "annotation-red"],
              ["Карточек", stats.totalCards, "annotation-blue"],
              ["Выучено", stats.learned, "annotation-green"],
              ["Повторов", stats.totalReviews, "annotation-gold"],
              ["Колоды", stats.totalDecks, "annotation-red"],
              ["Неделя", stats.reviewedWeek, "annotation-blue"]
            ].map(([label, value, tone]) => <div className={`profile-note ${tone}`} key={label}><span>{label}</span><strong>{value}</strong></div>)}
          </div>
          <hr />
          <div className="achievement-list">
            <div className="achievement"><strong>Ежедневный ритм</strong><span className="muted">Повторы за неделю</span></div>
            <div className="achievement"><strong>Строитель архива</strong><span className="muted">Колоды и карточки</span></div>
            <div className="achievement"><strong>Качество вспоминания</strong><span className="muted">Точность ответов</span></div>
            <div className="achievement"><strong>Рост знаний</strong><span className="muted">Выученные карточки</span></div>
          </div>
          <hr />
          <div className="toolbar"><Button type="button" onClick={toggleTheme}>Переключить тему</Button></div>
          <p className="muted">Аватар и тема сохраняются локально в браузере. Логика авторизации и данные Supabase не изменялись.</p>
        </section>
      </div>
    </Layout>
  );
}
