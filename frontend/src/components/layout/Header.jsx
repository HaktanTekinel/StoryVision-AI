import { NavLink, Link } from "react-router-dom";
import Button from "../ui/Button.jsx";

export default function Header() {
  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="StoryVision AI ana sayfa">
        <span className="brand-mark">SV</span>
        <span>
          <strong>StoryVision</strong>
          <small>AI Studio</small>
        </span>
      </Link>

      <nav className="main-nav" aria-label="Ana menü">
        <NavLink to="/">Ana Sayfa</NavLink>
        <NavLink to="/create">Hikâye Oluştur</NavLink>
        <NavLink to="/stories">Hikâyelerim</NavLink>
      </nav>

      <Button as={Link} to="/create" size="sm">
        Yeni Hikâye
      </Button>
    </header>
  );
}
