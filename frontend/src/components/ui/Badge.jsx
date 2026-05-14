export default function Badge({ children, variant = "soft" }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
