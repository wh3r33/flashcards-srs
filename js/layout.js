import { logout } from "./auth.js";

const navItems = [
  ["dashboard.html", "StudyOS.exe"],
  ["decks.html", "DeckManager.exe"],
  ["training.html", "Flashcards.exe"],
  ["public.html", "FileExplorer.exe"],
  ["profile.html", "UserProfile.exe"]
];

const titleIcons = {
  "Start_Menu.exe": "S",
  "StudyOS.exe": "S",
  "System_Monitor.exe": "M",
  "Deck_Manager.exe": "D",
  "DeckManager.exe": "D",
  "Flashcards.exe": "F",
  "flashcards.exe": "F",
  "AI_Generator.exe": "A",
  "File_Explorer.exe": "F",
  "FileExplorer.exe": "F",
  "Profile.exe": "U",
  "UserProfile.exe": "U",
  "Login.exe": "L",
  "Register.exe": "R"
};

export function windowHtml(title, body, extra = "") {
  const icon = titleIcons[title] || "?";
  return `
    <section class="window ${extra}">
      <div class="title-bar">
        <span class="title-left"><span class="program-icon">${icon}</span><span>${title}</span></span>
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
          <div class="start-brand"><span class="start-logo"></span><span>STUDY OS 98</span></div>
          <nav class="nav">
            <a class="win-button" href="/dashboard.html">Пуск StudyOS</a>
            ${nav}
            <button id="themeToggle" type="button">Display.cpl</button>
            <button id="logoutButton" type="button">Logoff.exe</button>
          </nav>
        `, "nav-window")}
        ${windowHtml(title, body)}
      </div>
      <div class="start-bar">
        <a class="win-button" href="/dashboard.html">Пуск</a>
        <div class="task-buttons"><div class="win-button task-button is-active">${title}</div></div>
        <div class="clock" id="clock"></div>
      </div>
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
