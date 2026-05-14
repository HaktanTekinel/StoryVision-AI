import { Link } from "react-router-dom";
import Button from "./Button.jsx";

export default function EmptyState({ title, description, actionLabel = "Hikâye Oluştur" }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">✦</div>
      <h2>{title}</h2>
      <p>{description}</p>
      <Button as={Link} to="/create">
        {actionLabel}
      </Button>
    </div>
  );
}
