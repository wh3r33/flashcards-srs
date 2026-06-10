import { tagsToText } from "../utils/csv";
import Button from "./Button";

const CARD_TYPES = {
  basic: "Вопрос и ответ",
  reverse: "Обратная карточка",
  multiple_choice: "Выбор ответа",
  cloze: "Пропуск"
};

export function cardTypeLabel(value) {
  return CARD_TYPES[value] || CARD_TYPES.basic;
}

export default function Flashcard({ card, canEdit, onEdit, onDelete }) {
  return (
    <li className="list-item flashcard">
      <header>
        <strong>{card.front}</strong>
        <span className="badge">{cardTypeLabel(card.card_type)}</span>
      </header>
      <p>{card.back}</p>
      <p className="muted">{card.category || "Без категории"} {tagsToText(card.tags)}</p>
      {canEdit && (
        <div className="row">
          <Button type="button" onClick={() => onEdit(card)}>Править</Button>
          <Button type="button" onClick={() => onDelete(card)}>Удалить</Button>
        </div>
      )}
    </li>
  );
}
