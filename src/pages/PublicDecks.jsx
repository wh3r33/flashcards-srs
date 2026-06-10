import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Button from "../components/Button";
import DeckCard from "../components/DeckCard";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../App";
import { copyPublicDeck, listPublicDecks } from "../services/deckService";

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
      setError(err.message);
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
    <Layout title="Shared Archive" activeTitle="public">
      <div className="deck-hero">
        <div>
          <div className="eyebrow">Shared knowledge</div>
          <h1 className="page-title">Collect notebooks from other minds.</h1>
          <p className="page-copy">Просматривайте публичные колоды и копируйте полезные коллекции в свое пространство.</p>
        </div>
      </div>
      <div className="explorer-layout">
        <div className="panel tree-panel">
          <div className="eyebrow">Curated shelf</div>
          <h2>Browse and collect</h2>
          <p className="muted">Публичные материалы представлены как выставка учебных блокнотов.</p>
        </div>
        <div>
          <div className="toolbar"><input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Поиск публичных колод" /><Button type="button" onClick={() => load()}>Найти</Button></div>
          {error && <div className="message danger">{error}</div>}
          {loading ? <LoadingState>Загружаю каталог...</LoadingState> : (
            <ul className="list folder-list">
              {decks.length ? decks.map((deck) => <DeckCard key={deck.id} deck={deck} to={`/decks/${deck.id}`} publicLabel canCopy={Boolean(user)} onCopy={copyDeck} />)
                : <li><EmptyState eyebrow="No public decks" title="Каталог пуст">Когда пользователи откроют доступ к колодам, они появятся здесь.</EmptyState></li>}
            </ul>
          )}
        </div>
      </div>
      <div className="status-bar"><span>{user ? "Copy enabled" : "Login required to copy"}</span><span>{decks.length} shared collections</span></div>
    </Layout>
  );
}
