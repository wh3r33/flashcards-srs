import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Button from "../components/Button";
import DeckCard from "../components/DeckCard";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../App";
import { copyPublicDeck, listPublicDecks } from "../services/deckService";
import { toRussianError } from "../utils/errors";

export default function PublicDecks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(nextSearch = search) {
    setLoading(true);
    try {
      setDecks(await listPublicDecks(nextSearch.trim()));
      setError("");
    } catch (err) {
      setError(toRussianError(err, "Не удалось загрузить публичный каталог."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("");
  }, []);

  async function copyDeck(deck) {
    const copied = await copyPublicDeck(deck.id, user.id);
    navigate(`/decks/${copied.id}`);
  }

  function updateSearch(value) {
    setSearch(value);
    load(value);
  }

  return (
    <Layout title="Публичный каталог" activeTitle="Каталог">
      <div className="deck-hero">
        <div>
          <div className="eyebrow">Общие материалы</div>
          <h1 className="page-title">Забирайте полезные колоды себе.</h1>
          <p className="page-copy">Просматривайте публичные колоды и копируйте полезные коллекции в свое пространство.</p>
        </div>
      </div>
      <div className="explorer-layout">
        <div className="panel tree-panel">
          <div className="eyebrow">Открытая полка</div>
          <h2>Найдите готовый набор</h2>
          <p className="muted">Публичные материалы представлены как выставка учебных блокнотов.</p>
        </div>
        <div>
          <div className="toolbar"><input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Поиск публичных колод" /><Button type="button" onClick={() => load()}>Найти</Button></div>
          {error && <div className="message danger">{error}</div>}
          {loading ? <LoadingState>Загружаю каталог...</LoadingState> : (
            <ul className="list folder-list">
              {decks.length ? decks.map((deck) => <DeckCard key={deck.id} deck={deck} to={`/decks/${deck.id}`} publicLabel canCopy={Boolean(user)} onCopy={copyDeck} />)
                : <li><EmptyState eyebrow="Нет публичных колод" title="Каталог пуст">Когда пользователи откроют доступ к колодам, они появятся здесь.</EmptyState></li>}
            </ul>
          )}
        </div>
      </div>
      <div className="status-bar"><span>{user ? "Копирование доступно" : "Войдите, чтобы копировать колоды"}</span><span>Публичные колоды: {decks.length}</span></div>
    </Layout>
  );
}
