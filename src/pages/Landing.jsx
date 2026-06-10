import { Link } from "react-router-dom";
import Layout, { Window } from "../components/Layout";
import Button from "../components/Button";
import { isSupabaseConfigured } from "../lib/supabaseClient";

export default function Landing() {
  return (
    <Layout simple>
      <Window title="Second Brain Studio" extra="hero-window">
        {!isSupabaseConfigured() && <div className="message danger">Supabase не подключён. Проверьте переменные VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY</div>}
        <div className="hero-layout">
          <div>
            <div className="eyebrow">Personal knowledge collection</div>
            <h1 className="hero-title">Build your living library.</h1>
            <p className="hero-copy">Карточки, заметки, повторения и AI-подготовка складываются в личный учебный журнал, а не в очередной рабочий dashboard.</p>
            <div className="row">
              <Button as={Link} to="/register">Создать аккаунт</Button>
              <Button as={Link} to="/login">Войти</Button>
              <Button as={Link} to="/public">Открыть каталог</Button>
            </div>
          </div>
          <div className="desktop-preview" aria-label="Коллаж учебного журнала">
            <div className="scrap scrap-book">Knowledge<br />Library</div>
            <div className="scrap scrap-card">Recall<br />Cards</div>
            <div className="scrap scrap-note">AI Study<br />Notes</div>
            <div className="window mini-window">
              <div className="title-bar"><span className="title-left"><span className="program-icon">M</span><span>Memory rhythm</span></span><span className="window-controls" aria-hidden="true"><b></b><b></b><b></b></span></div>
              <div className="window-body"><div className="chart">{[2, 6, 4, 9, 5, 7, 3].map((value) => <div className="bar" style={{ height: `${value * 13}px` }} key={value}>{value}</div>)}</div></div>
            </div>
          </div>
        </div>
        <div className="status-bar"><span>Ready for collection</span><span>Designed as a second brain</span></div>
      </Window>
    </Layout>
  );
}
