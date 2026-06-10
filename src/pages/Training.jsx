import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import Button from "../components/Button";
import LoadingState from "../components/LoadingState";
import { dueCards } from "../services/cardService";
import { explainCard } from "../services/aiService";
import { reviewCard } from "../services/reviewService";
import { RATINGS } from "../utils/srs";

export default function Training() {
  const { deckId } = useParams();
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [explanation, setExplanation] = useState("");
  const [showExplain, setShowExplain] = useState(false);

  useEffect(() => {
    dueCards(deckId === "all" ? null : deckId)
      .then(setCards)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [deckId]);

  const current = cards[index];

  async function rate(rating) {
    if (!showingAnswer || !current) return;
    await reviewCard(current, rating);
    if (rating === "again") {
      setShowExplain(true);
    } else {
      nextCard();
    }
  }

  function nextCard() {
    setIndex((value) => value + 1);
    setShowingAnswer(false);
    setShowExplain(false);
    setExplanation("");
  }

  async function handleExplain() {
    setExplanation("Готовлю объяснение...");
    try {
      setExplanation(await explainCard(current.front, current.back));
    } catch (err) {
      setExplanation(`ИИ не смог объяснить тему: ${err.message}`);
    }
  }

  return (
    <Layout title="Recall Studio" activeTitle="training">
      <div className="training-intro">
        <div>
          <div className="eyebrow">Immersive recall</div>
          <h1 className="page-title">One beautiful study card at a time.</h1>
          <p className="page-copy">Вопрос, раскрытие ответа и оценка памяти выстроены как спокойный учебный ритуал без лишних отвлечений.</p>
        </div>
      </div>
      <div className="training-shell">
        {loading && <LoadingState>Загружаю карточки к повторению...</LoadingState>}
        {error && <div className="message danger">{error}</div>}
        {!loading && !error && (
          <div className="training-stage" aria-live="polite">
            <div className="message">{current ? `Карточка ${index + 1} из ${cards.length}` : "На сейчас карточек нет."}</div>
            <div className={`training-card ${showingAnswer ? "is-answer" : ""}`}>{current ? (showingAnswer ? current.back : current.front) : "Повторения завершены"}</div>
            {current && (
              <>
                <div className="toolbar training-actions">
                  {!showingAnswer && <Button type="button" onClick={() => setShowingAnswer(true)}>Показать ответ</Button>}
                  {showExplain && <Button type="button" onClick={handleExplain}>Объяснить тему</Button>}
                </div>
                {showingAnswer && (
                  <div className="rating-grid">
                    <Button type="button" onClick={() => rate("again")}>{RATINGS.again}</Button>
                    <Button type="button" onClick={() => rate("hard")}>{RATINGS.hard}</Button>
                    <Button type="button" onClick={() => rate("normal")}>{RATINGS.normal}</Button>
                    <Button type="button" onClick={() => rate("easy")}>{RATINGS.easy}</Button>
                  </div>
                )}
                {explanation && <div className="help-document">{explanation}</div>}
                {explanation && <Button type="button" onClick={nextCard}>Следующая карточка</Button>}
              </>
            )}
          </div>
        )}
      </div>
      <div className="status-bar"><span>Spaced repetition active</span><span>Designed for recall, not browsing</span></div>
    </Layout>
  );
}
