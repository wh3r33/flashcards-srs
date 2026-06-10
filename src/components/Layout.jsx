import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "./Navigation";

const titleIcons = {
  "Second Brain Studio": "S",
  "My Knowledge Journal": "M",
  "Notebook Library": "N",
  "Deck Notebook": "D",
  "Recall Studio": "R",
  "Shared Archive": "A",
  "Study Workspace": "U",
  "Login.exe": "L",
  "Register.exe": "R"
};

export function Window({ title, children, extra = "" }) {
  return (
    <section className={`window ${extra}`.trim()}>
      <div className="title-bar">
        <span className="title-left"><span className="program-icon">{titleIcons[title] || "S"}</span><span>{title}</span></span>
        <span className="window-controls" aria-hidden="true"><b></b><b></b><b></b></span>
      </div>
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
    return <main className="desktop single-window">{children}</main>;
  }

  return (
    <main className="desktop">
      <div className="shell">
        <Navigation title={title} onThemeToggle={toggleTheme} />
        <Window title={title}>{children}</Window>
      </div>
      <div className="start-bar">
        <Link className="win-button" to="/dashboard">Journal</Link>
        <div className="task-buttons"><div className="win-button task-button is-active">{activeTitle || title}</div></div>
        <div className="clock">{clock}</div>
      </div>
    </main>
  );
}
