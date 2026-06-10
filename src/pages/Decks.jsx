import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import DeckCard from "../components/DeckCard";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../App";
import { createDeck, deleteDeck, getDeck, listDecks, updateDeck } from "../services/deckService";

const emptyDeck = { id: "", name: "", description: "", is_public: false };

export default function Decks() {
  const { user } = useAuth();
  const [decks, setDecks] = useState([]);
  const [search, setSearch] = useState("");
  const [formDeck, setFormDeck] = useState(emptyDeck);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(nextSearch = search) {
    setLoading(true);
    try {
      setDecks(await listDecks(nextSearch.trim()));
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

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("Сохраняю...");
    try {
      const payload = { name: formDeck.name, description: formDeck.description, is_public: formDeck.is_public };
      if (formDeck.id) await updateDeck(formDeck.id, payload);
      else await createDeck(payload, user.id);
      setFormDeck(emptyDeck);
      setMessage("Готово.");
      await load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleEdit(deck) {
    setFormDeck(await getDeck(deck.id));
  }

  async function handleDelete(deck) {
    if (!confirm("Удалить колоду?")) return;
    await deleteDeck(deck.id);
    await load();
  }

  function updateSearch(value) {
    setSearch(value);
    load(value);
  }

  return (
    <Layout title="Notebook Library" activeTitle="decks">
      <div className="deck-hero">
        <div>
          <div className="eyebrow">Personal archive</div>
          <h1 className="page-title">Decks should feel worth opening.</h1>
          <p className="page-copy">Каждая колода оформлена как отдельный учебный блокнот: с ярлыком, закладкой и собственной ролью в системе знаний.</p>
        </div>
      </div>
      <div className="explorer-layout">
        <div className="panel tree-panel">
          <div className="eyebrow">{formDeck.id ? "Edit notebook" : "New notebook"}</div>
          <h2>{formDeck.id ? formDeck.name : "Start a collection"}</h2>
          <p className="muted">Назовите тему так, будто ставите новый блокнот на полку личной библиотеки.</p>
          <hr />
          <form onSubmit={handleSubmit}>
            <label>Название<input required value={formDeck.name} onChange={(event) => setFormDeck({ ...formDeck, name: event.target.value })} /></label>
            <label>Описание<textarea value={formDeck.description || ""} onChange={(event) => setFormDeck({ ...formDeck, description: event.target.value })}></textarea></label>
            <label className="row"><input style={{ width: "auto" }} type="checkbox" checked={Boolean(formDeck.is_public)} onChange={(event) => setFormDeck({ ...formDeck, is_public: event.target.checked })} /> Публичная колода</label>
            <Button type="submit">{formDeck.id ? "Сохранить" : "Создать колоду"}</Button>
          </form>
          <div className={`message ${message ? "success" : "hidden"}`}>{message}</div>
        </div>
        <div>
          <div className="toolbar"><input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Поиск по библиотеке" /><Button type="button" onClick={() => load()}>Найти</Button></div>
          {error && <div className="message danger">{error}</div>}
          {loading ? <LoadingState>Загружаю колоды...</LoadingState> : (
            <ul className="list folder-list">
              {decks.length ? decks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} to={`/decks/${deck.id}`} onEdit={handleEdit} onDelete={handleDelete} />
              )) : <li><EmptyState eyebrow="Empty library" title="Коллекций пока нет">Создайте первую колоду слева и превратите заметки в систему повторения.</EmptyState></li>}
            </ul>
          )}
        </div>
      </div>
      <div className="status-bar"><span>{user.email}</span><span>{decks.length} collections</span></div>
    </Layout>
  );
}
