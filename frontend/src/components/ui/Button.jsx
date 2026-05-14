export default function Button({
  as: Component = "button",
  children,
  className = "",
  variant = "primary",
  size = "md",
  ...props
}) {
  return (
    <Component className={`button button-${variant} button-${size} ${className}`} {...props}>
      {children}
    </Component>
  );
}
