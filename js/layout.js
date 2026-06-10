import { logout } from "./auth.js";

const navItems = [
  ["dashboard.html", "Рабочий стол"],
  ["decks.html", "Мои колоды"],
  ["training.html", "Тренировка"],
  ["public.html", "Публичные"],
  ["profile.html", "Профиль"]
];

export function windowHtml(title, body, extra = "") {
  return `
    <section class="window ${extra}">
      <div class="title-bar">
        <span class="title-left"><span class="program-icon">?</span><span>${title}</span></span>
        <span class="window-controls"><b>_</b><b>□</b><b>×</b></span>
      </div>
      <div class="window-body">${body}</div>
    </section>
  `;
}

export function appShell(title, body, active) {
  const nav = navItems.map(([href, label]) => (
    `<a href="/${href}" class="${active === href ? "is-active" : ""}">${label}</a>`
  )).join("");

  return `
    <main class="desktop">
      <div class="shell">
        ${windowHtml("Start_Menu.exe", `
          <nav class="nav">
            <a class="win-button" href="/dashboard.html">Пуск StudyOS</a>
            ${nav}
            <button id="themeToggle" type="button">Тема</button>
            <button id="logoutButton" type="button">Выход</button>
          </nav>
        `)}
        ${windowHtml(title, body)}
      </div>
      <div class="start-bar"><a class="win-button" href="/dashboard.html">Пуск</a><div class="clock" id="clock"></div></div>
    </main>
  `;
}

export function bindShell() {
  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) logoutButton.addEventListener("click", logout);
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) themeToggle.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("studyos-theme", next);
  });
  const clock = document.getElementById("clock");
  if (clock) {
    const tick = () => { clock.textContent = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }); };
    tick();
    setInterval(tick, 30000);
  }
}

export function applyTheme() {
  document.documentElement.dataset.theme = localStorage.getItem("studyos-theme") || "light";
}
