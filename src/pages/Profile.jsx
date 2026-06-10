import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import AvatarUploader from "../components/AvatarUploader";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../App";
import { dashboardStats } from "../services/reviewService";

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardStats().then(setStats).catch((err) => setError(err.message));
  }, []);

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("studyos-theme", next);
  }

  return (
    <Layout title="Study Workspace" activeTitle="profile">
      <div className="profile-hero">
        <div>
          <div className="eyebrow">Learning identity</div>
          <h1 className="page-title">Your desk inside the second brain.</h1>
          <p className="page-copy">Аватар, серия, достижения и рост знаний собраны как персональное учебное пространство.</p>
        </div>
      </div>
      <div className="profile-grid">
        <AvatarUploader user={user} />
        <section className="panel">
          <div className="eyebrow">Learning signature</div>
          <h2>Collector profile</h2>
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
            <div className="achievement"><strong>Daily rhythm</strong><span className="muted">Повторы за неделю</span></div>
            <div className="achievement"><strong>Archive builder</strong><span className="muted">Колоды и карточки</span></div>
            <div className="achievement"><strong>Recall quality</strong><span className="muted">Точность ответов</span></div>
            <div className="achievement"><strong>Knowledge growth</strong><span className="muted">Выученные карточки</span></div>
          </div>
          <hr />
          <div className="toolbar"><Button type="button" onClick={toggleTheme}>Переключить тему</Button></div>
          <p className="muted">Аватар и тема сохраняются локально в браузере. Логика авторизации и данные Supabase не изменялись.</p>
        </section>
      </div>
    </Layout>
  );
}
