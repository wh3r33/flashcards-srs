export function toRussianError(error, fallback = "Не удалось выполнить действие. Попробуйте еще раз.") {
  const message = String(error?.message || error || "").trim();
  if (!message) return fallback;

  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "Неверная почта или пароль.";
  if (lower.includes("email not confirmed")) return "Почта еще не подтверждена.";
  if (lower.includes("user already registered")) return "Аккаунт с этой почтой уже существует.";
  if (lower.includes("password should be")) return "Пароль слишком короткий.";
  if (lower.includes("failed to fetch") || lower.includes("network")) return "Нет соединения с сервером. Проверьте интернет и повторите попытку.";
  if (lower.includes("jwt") || lower.includes("token")) return "Сессия устарела. Войдите заново.";
  if (lower.includes("row-level security") || lower.includes("permission denied")) return "Нет доступа к этим данным.";
  if (lower.includes("edge function")) return "Серверная функция временно недоступна.";
  if (/[а-яё]/i.test(message)) return message;

  return fallback;
}
