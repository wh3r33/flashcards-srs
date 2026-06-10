import { useEffect, useState } from "react";
import Navigation from "./Navigation";

const titleIcons = {
  "Картотека памяти": "К",
  "Журнал памяти": "Ж",
  "Библиотека колод": "Б",
  "Блокнот колоды": "К",
  "Тренировка": "Т",
  "Публичный каталог": "П",
  "Профиль обучения": "П",
  "Вход": "В",
  "Регистрация": "Р"
};

export function Window({ title, children, extra = "" }) {
  return (
    <section className={`workspace-panel ${extra}`.trim()} aria-label={title}>
      <div className="window-body">{children}</div>
    </section>
  );
}

export default function Layout({ title, activeTitle, children, simple = false }) {
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const timer = setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, []);

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("studyos-theme", next);
  }

  if (simple) {
    return <main className="desktop public-canvas">{children}</main>;
  }

  return (
    <main className="desktop">
      <div className="app-shell">
        <Navigation title={title} onThemeToggle={toggleTheme} />
        <section className="workspace" aria-label={title}>
          <div className="workspace-topline">
            <span>{activeTitle || title}</span>
            <span>{clock}</span>
          </div>
          <Window title={title}>{children}</Window>
        </section>
      </div>
    </main>
  );
}
