import { Link } from "react-router-dom";
import Layout, { Window } from "../components/Layout";
import Button from "../components/Button";
import { isSupabaseConfigured } from "../lib/supabaseClient";

export default function Landing() {
  return (
    <Layout simple>
      <Window title="Картотека памяти" extra="hero-window">
        {!isSupabaseConfigured() && <div className="message danger">Supabase не подключен. Проверьте переменные VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.</div>}
        <div className="hero-layout">
          <div>
            <div className="eyebrow">Личная система знаний</div>
            <h1 className="hero-title">Учебный стол памяти.</h1>
            <p className="hero-copy">Собирайте колоды, превращайте тексты в карточки и возвращайтесь к знаниям по расписанию.</p>
            <div className="row">
              <Button as={Link} to="/register">Создать аккаунт</Button>
              <Button as={Link} to="/login">Войти</Button>
              <Button as={Link} to="/public">Открыть каталог</Button>
            </div>
          </div>
          <div className="study-collage" aria-label="Учебные карточки, папки и заметки">
            <div className="sky-panel"></div>
            <div className="folder-stack"><span>Архив</span><strong>42</strong><small>карточки к сроку</small></div>
            <div className="paper-note">Сегодня повторить<br />важное, не все сразу.</div>
            <div className="study-photo"></div>
            <div className="mini-chart" aria-label="Ритм повторений">
              {[2, 5, 3, 7, 4, 6, 8].map((value, index) => <span style={{ "--h": `${value * 13}px` }} key={`${value}-${index}`}></span>)}
            </div>
          </div>
        </div>
      </Window>
    </Layout>
  );
}
