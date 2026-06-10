import { NavLink, Link } from "react-router-dom";
import { logout } from "../services/authService";

const navItems = [
  ["/dashboard", "Обзор", "⌂"],
  ["/decks", "Колоды", "▤"],
  ["/training/all", "Повторение", "↯"],
  ["/public", "Каталог", "□"],
  ["/profile", "Профиль", "○"]
];

export default function Navigation({ title, onThemeToggle }) {
  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  return (
    <aside className="nav-window">
      <Link className="start-brand" to="/dashboard" aria-label="Картотека памяти">
        <span className="start-logo">К</span>
        <span>Картотека<br />памяти</span>
      </Link>
      <nav className="nav" aria-label={title}>
        {navItems.map(([href, label, icon]) => (
          <NavLink key={href} to={href} className={({ isActive }) => isActive ? "is-active" : ""}>
            <span aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </NavLink>
          ))}
      </nav>
      <div className="nav-actions">
        <button type="button" onClick={onThemeToggle}>Тема</button>
        <button type="button" onClick={handleLogout}>Выйти</button>
      </div>
    </aside>
  );
}
