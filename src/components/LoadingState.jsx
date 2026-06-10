export default function LoadingState({ children = "Загружаю..." }) {
  return (
    <div className="loading-state" aria-live="polite">
      <span aria-hidden="true"></span>
      <strong>{children}</strong>
    </div>
  );
}
