import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Layout, { Window } from "../components/Layout";
import Button from "../components/Button";
import { login } from "../services/authService";
import { isSupabaseConfigured } from "../lib/supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setKind("");
    setMessage("Вхожу...");
    try {
      await login(form.get("email"), form.get("password"));
      navigate(location.state?.next || "/dashboard", { replace: true });
    } catch (error) {
      setKind("danger");
      setMessage(error.message);
    }
  }

  return (
    <Layout simple>
      <Window title="Login.exe" extra="hero-window">
        {!isSupabaseConfigured() && <div className="message danger">Supabase не подключён. Проверьте env-переменные.</div>}
        <form onSubmit={handleSubmit}>
          <label>Почта<input name="email" type="email" required autoComplete="email" /></label>
          <label>Пароль<input name="password" type="password" required autoComplete="current-password" /></label>
          <Button type="submit">Войти</Button>
          <Button as={Link} to="/register">Создать аккаунт</Button>
          <div className={`message ${kind} ${message ? "" : "hidden"}`}>{message}</div>
        </form>
      </Window>
    </Layout>
  );
}
