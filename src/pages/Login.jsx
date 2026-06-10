import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Layout, { Window } from "../components/Layout";
import Button from "../components/Button";
import { login } from "../services/authService";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { toRussianError } from "../utils/errors";

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
      setMessage(toRussianError(error, "Не удалось войти. Проверьте данные и повторите попытку."));
    }
  }

  return (
    <Layout simple>
      <Window title="Вход" extra="hero-window auth-window">
        {!isSupabaseConfigured() && <div className="message danger">Supabase не подключен. Проверьте переменные окружения.</div>}
        <form onSubmit={handleSubmit}>
          <div className="auth-copy">
            <div className="eyebrow">Возвращение к учебе</div>
            <h1 className="page-title">Войдите в свою картотеку.</h1>
            <p className="page-copy">После входа откроются ваши колоды, карточки, статистика и тренировки.</p>
          </div>
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
