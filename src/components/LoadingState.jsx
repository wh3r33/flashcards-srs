export default function LoadingState({ children = "Загружаю..." }) {
  return <div className="message">{children}</div>;
}
