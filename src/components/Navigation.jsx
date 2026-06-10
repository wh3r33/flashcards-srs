import { NavLink, Link } from "react-router-dom";
import { logout } from "../services/authService";

const navItems = [
  ["/dashboard", "Journal"],
  ["/decks", "Notebooks"],
  ["/training/all", "Recall"],
  ["/public", "Archive"],
  ["/profile", "Desk"]
];

export default function Navigation({ title, onThemeToggle }) {
  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  return (
    <section className="window nav-window">
      <div className="title-bar">
        <span className="title-left"><span className="program-icon">L</span><span>Library Index</span></span>
        <span className="window-controls" aria-hidden="true"><b></b><b></b><b></b></span>
      </div>
      <div className="window-body">
        <div className="start-brand"><span className="start-logo"></span><span>Second Brain Studio</span></div>
        <nav className="nav" aria-label={title}>
          <Link className="win-button" to="/dashboard">Home base</Link>
          {navItems.map(([href, label]) => (
            <NavLink key={href} to={href} className={({ isActive }) => isActive ? "is-active" : ""}>{label}</NavLink>
          ))}
          <button type="button" onClick={onThemeToggle}>Switch light</button>
          <button type="button" onClick={handleLogout}>Sign out</button>
        </nav>
      </div>
    </section>
  );
}
