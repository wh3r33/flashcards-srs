export default function Button({ as: Component = "button", className = "", children, ...props }) {
  return (
    <Component className={`win-button ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}
