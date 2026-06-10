import { Link } from "react-router-dom";
import Button from "./Button";

export default function DeckCard({ deck, to, canCopy, onCopy, onEdit, onDelete, publicLabel = false }) {
  return (
    <li className="list-item folder-item notebook-item deck-card">
      <div className="folder-icon"></div>
      <header>
        <strong>{deck.name}</strong>
        <span className="badge">{publicLabel || deck.is_public ? "Public" : "Private"}</span>
      </header>
      <p>{deck.description || "Без описания"}</p>
      <div className="row">
        <Button as={Link} to={to}>Открыть</Button>
        {onEdit && <Button type="button" onClick={() => onEdit(deck)}>Править</Button>}
        {onDelete && <Button type="button" onClick={() => onDelete(deck)}>Удалить</Button>}
        {onCopy && <Button type="button" disabled={!canCopy} onClick={() => onCopy(deck)}>Скопировать</Button>}
      </div>
    </li>
  );
}
