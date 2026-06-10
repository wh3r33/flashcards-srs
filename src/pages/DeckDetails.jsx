import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Flashcard from "../components/Flashcard";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../App";
import { getDeck } from "../services/deckService";
import { createCard, createCards, deleteCard, listCards, updateCard } from "../services/cardService";
import { generateCardsFromText } from "../services/aiService";
import { exportCardsCsv, parseCsv, splitTags, tagsToText } from "../utils/csv";

const CARD_TYPES = [
  ["basic", "Вопрос и ответ"],
  ["reverse", "Обратная карточка"],
  ["multiple_choice", "Выбор ответа"],
  ["cloze", "Пропуск"]
];
const emptyCard = { id: "", front: "", back: "", category: "", tags: [], card_type: "basic" };

export default function DeckDetails() {
  const { deckId } = useParams();
  const { user } = useAuth();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [formCard, setFormCard] = useState(emptyCard);
  const [filters, setFilters] = useState({ category: "", tag: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);

  const canEdit = Boolean(user && deck && user.id === deck.user_id);

  async function loadDeck() {
    const loaded = await getDeck(deckId);
    setDeck(loaded);
  }

  async function loadCards(nextFilters = filters) {
    setLoading(true);
    try {
      setCards(await listCards(deckId, nextFilters));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeck().catch((err) => setError(err.message));
    loadCards();
  }, [deckId]);

  async function handleCardSubmit(event) {
    event.preventDefault();
    setMessage("Сохраняю...");
    try {
      const payload = {
        deck_id: deckId,
        front: formCard.front,
        back: formCard.back,
        category: formCard.category || null,
        tags: Array.isArray(formCard.tags) ? formCard.tags : splitTags(formCard.tags),
        card_type: formCard.card_type
      };
      if (formCard.id) await updateCard(formCard.id, payload);
      else await createCard(payload);
      setFormCard(emptyCard);
      setMessage("Карточка сохранена.");
      await loadCards();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text).map((row) => ({ ...row, deck_id: deckId, interval_days: 1, ease_factor: 2.5, next_review_at: new Date().toISOString() }));
    await createCards(rows);
    await loadCards();
  }

  async function handleDelete(card) {
    if (!confirm("Удалить карточку?")) return;
    await deleteCard(card.id);
    await loadCards();
  }

  function updateFilter(name, value) {
    const next = { ...filters, [name]: value };
    setFilters(next);
  }

  if (!deck && !error) return <Layout title="Deck Notebook"><LoadingState>Загружаю колоду...</LoadingState></Layout>;

  return (
    <Layout title="Deck Notebook" activeTitle="decks">
      {error && <div className="message danger">{error}</div>}
      {deck && (
        <>
          <div className="deck-hero">
            <div>
              <div className="eyebrow">{canEdit ? "Editable notebook" : "Public preview"}</div>
              <h1 className="page-title">{deck.name}</h1>
              <p className="page-copy">{deck.description || "Без описания"}</p>
            </div>
            <div className="row">
              {canEdit && <Button as={Link} to={`/training/${deck.id}`}>Тренировать</Button>}
              <Button type="button" onClick={() => exportCardsCsv(cards, deck.name)}>Экспорт CSV</Button>
              {canEdit && <label className="win-button">Импорт CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} /></label>}
              {canEdit && <Button type="button" onClick={() => setAiOpen(true)}>AI генерация</Button>}
            </div>
          </div>
          <div className="split">
            {canEdit ? (
              <div className="panel">
                <div className="eyebrow">New card</div>
                <h2>Add a study slip</h2>
                <form onSubmit={handleCardSubmit}>
                  <label>Лицевая сторона<textarea required value={formCard.front} onChange={(event) => setFormCard({ ...formCard, front: event.target.value })}></textarea></label>
                  <label>Обратная сторона<textarea required value={formCard.back} onChange={(event) => setFormCard({ ...formCard, back: event.target.value })}></textarea></label>
                  <div className="grid two">
                    <label>Категория<input value={formCard.category || ""} onChange={(event) => setFormCard({ ...formCard, category: event.target.value })} /></label>
                    <label>Теги через запятую<input value={tagsToText(formCard.tags)} onChange={(event) => setFormCard({ ...formCard, tags: splitTags(event.target.value) })} /></label>
                  </div>
                  <label>Тип карточки<select value={formCard.card_type} onChange={(event) => setFormCard({ ...formCard, card_type: event.target.value })}>{CARD_TYPES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                  <Button type="submit">{formCard.id ? "Сохранить карточку" : "Создать карточку"}</Button>
                </form>
                <div className={`message ${message ? "success" : "hidden"}`}>{message}</div>
              </div>
            ) : (
              <div className="panel"><div className="eyebrow">Read only</div><h2>Public preview</h2><p className="muted">Чтобы редактировать, скопируйте колоду себе из каталога.</p></div>
            )}
            <div>
              <div className="toolbar">
                <input value={filters.category} onChange={(event) => updateFilter("category", event.target.value)} placeholder="Категория" />
                <input value={filters.tag} onChange={(event) => updateFilter("tag", event.target.value)} placeholder="Тег" />
                <Button type="button" onClick={() => loadCards()}>Фильтр</Button>
              </div>
              {loading ? <LoadingState>Загружаю карточки...</LoadingState> : (
                <ul className="list card-list system-list">
                  {cards.length ? cards.map((card) => <Flashcard key={card.id} card={card} canEdit={canEdit} onEdit={setFormCard} onDelete={handleDelete} />)
                    : <li><EmptyState eyebrow="No cards" title="Карточек пока нет">Добавьте первую карточку или импортируйте CSV, чтобы собрать тренировочный набор.</EmptyState></li>}
                </ul>
              )}
            </div>
          </div>
          <div className="status-bar"><span>{canEdit ? "Editable" : "Read only"}</span><span>{cards.length} cards</span></div>
          {aiOpen && <AiModal deckId={deckId} onClose={() => setAiOpen(false)} onSaved={loadCards} />}
        </>
      )}
    </Layout>
  );
}

function AiModal({ deckId, onClose, onSaved }) {
  const [generated, setGenerated] = useState([]);
  const [picked, setPicked] = useState([]);
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState("");

  async function handleGenerate(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setKind("");
    setMessage("Генерирую карточки...");
    try {
      const cards = await generateCardsFromText(form.get("text"), Number(form.get("amount")), deckId);
      setGenerated(cards);
      setPicked(cards.map((_, index) => index));
      setKind("success");
      setMessage("Выберите карточки для сохранения.");
    } catch (err) {
      setKind("danger");
      setMessage(`ИИ не смог сгенерировать карточки: ${err.message}`);
    }
  }

  async function saveSelected() {
    const rows = picked.map((index) => generated[index]).map((card) => ({
      deck_id: deckId,
      front: card.front,
      back: card.back,
      category: card.category || null,
      tags: Array.isArray(card.tags) ? card.tags : [],
      card_type: card.card_type || "basic",
      interval_days: 1,
      ease_factor: 2.5,
      next_review_at: new Date().toISOString()
    }));
    await createCards(rows);
    await onSaved();
    onClose();
  }

  function togglePick(index) {
    setPicked((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  }

  return (
    <Modal title="AI study notes" icon="A" onClose={onClose}>
      <div className="menu-bar"><span className="menu-item">Source text</span><span className="menu-item">Generate</span><span className="menu-item">Review</span></div>
      <form onSubmit={handleGenerate}>
        <label>Текст для карточек<textarea className="notepad" name="text" required></textarea></label>
        <label>Количество<select name="amount" defaultValue="5"><option>5</option><option>10</option><option>20</option></select></label>
        <Button type="submit">Сгенерировать из текста</Button>
      </form>
      <div className={`message ${kind} ${message ? "" : "hidden"}`}>{message}</div>
      <form className="list system-list">
        {generated.map((card, index) => (
          <label className="list-item preview-card" key={`${card.front}-${index}`}>
            <input type="checkbox" checked={picked.includes(index)} onChange={() => togglePick(index)} />
            <span><strong>{card.front}</strong><br />{card.back}<br /><span className="muted">{card.category || ""} {tagsToText(card.tags)}</span></span>
          </label>
        ))}
      </form>
      <div className="row"><Button type="button" disabled={!picked.length} onClick={saveSelected}>Сохранить выбранные</Button><Button type="button" onClick={onClose}>Закрыть</Button></div>
    </Modal>
  );
}
