import { Link, useNavigate } from "react-router-dom";
import Layout, { Window } from "../components/Layout";
import Button from "../components/Button";
import { register } from "../services/authService";
import { useState } from "react";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { toRussianError } from "../utils/errors";

export default function Register() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setKind("");
    setMessage("Создаю аккаунт...");
    try {
      await register(form.get("email"), form.get("password"));
      setKind("success");
      setMessage("Аккаунт создан. Проверьте почту, если включено подтверждение.");
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (error) {
      setKind("danger");
      setMessage(toRussianError(error, "Не удалось создать аккаунт. Проверьте данные и повторите попытку."));
    }
  }

  return (
    <Layout simple>
      <Window title="Регистрация" extra="hero-window auth-window">
        {!isSupabaseConfigured() && <div className="message danger">Supabase не подключен. Проверьте переменные окружения.</div>}
        <form onSubmit={handleSubmit}>
          <div className="auth-copy">
            <div className="eyebrow">Новая картотека</div>
            <h1 className="page-title">Создайте учебное пространство.</h1>
            <p className="page-copy">Добавляйте колоды, импортируйте CSV и тренируйте память по расписанию.</p>
          </div>
          <label>Почта<input name="email" type="email" required autoComplete="email" /></label>
          <label>Пароль<input name="password" type="password" minLength="6" required autoComplete="new-password" /></label>
          <Button type="submit">Зарегистрироваться</Button>
          <Button as={Link} to="/login">Уже есть аккаунт</Button>
          <div className={`message ${kind} ${message ? "" : "hidden"}`}>{message}</div>
        </form>
      </Window>
    </Layout>
  );
}
