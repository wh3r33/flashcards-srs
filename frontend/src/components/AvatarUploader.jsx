import { useEffect, useState } from "react";
import Button from "./Button";

export default function AvatarUploader({ user }) {
  const avatarKey = `studyos-avatar:${user.id}`;
  const [avatar, setAvatar] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setAvatar(localStorage.getItem(avatarKey) || "");
  }, [avatarKey]);

  function updateAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Выберите изображение.");
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      localStorage.setItem(avatarKey, reader.result);
      setAvatar(String(reader.result));
      setMessage("Аватар обновлен.");
    });
    reader.readAsDataURL(file);
  }

  function removeAvatar() {
    localStorage.removeItem(avatarKey);
    setAvatar("");
      setMessage("Аватар удален.");
  }

  return (
    <section className="panel avatar-card">
      <div className="avatar-preview">
        {avatar ? <img src={avatar} alt="Аватар пользователя" /> : user.email.slice(0, 1).toUpperCase()}
      </div>
      <div>
        <div className="eyebrow">Аватар</div>
        <h2>{user.email.split("@")[0]}</h2>
        <p className="muted">{user.email}</p>
      </div>
      <div className="row avatar-actions">
        <label className="win-button">Загрузить<input type="file" accept="image/*" className="hidden" onChange={updateAvatar} /></label>
        <Button type="button" onClick={removeAvatar}>Удалить</Button>
      </div>
      <div className={`message ${message ? "success" : "hidden"}`}>{message}</div>
    </section>
  );
}
