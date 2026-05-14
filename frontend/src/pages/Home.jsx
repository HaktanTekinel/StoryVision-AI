import { Link } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import SectionTitle from "../components/ui/SectionTitle.jsx";
import ProcessTimeline from "../components/story/ProcessTimeline.jsx";
import StatsStrip from "../components/story/StatsStrip.jsx";

export default function Home() {
  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">AI destekli yaratıcı stüdyo</span>
          <h1>Bir fikri hikâyeye, hikâyeyi sinematik bir deneyime dönüştür.</h1>
          <p>
            StoryVision AI; karakterini, atmosferini ve sahnelerini bir araya getirerek
            izlenebilir bir hikâye yolculuğu tasarlamanı sağlar.
          </p>
          <div className="hero-actions">
            <Button as={Link} to="/create">
              Hemen Başla
            </Button>
            <Button as={Link} to="/stories" variant="secondary">
              Hikâyelerim
            </Button>
          </div>
          <StatsStrip />
        </div>

        <Card className="hero-showcase">
          <div className="showcase-frame">
            <div className="play-orb">▶</div>
            <div className="showcase-caption">
              <strong>Gece Kütüphanesi</strong>
              <span>Fantastik • Sinematik • 3 Sahne</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="content-section">
        <SectionTitle
          eyebrow="Nasıl çalışır?"
          title="Hikâyen tek bir akışta şekillenir"
          description="Fikirden video taslağına kadar her adım sade, anlaşılır ve yaratıcı bir deneyim olarak tasarlandı."
        />
        <ProcessTimeline />
      </section>

      <section className="content-section split-section">
        <Card className="feature-card large-feature">
          <span className="eyebrow">Yaratıcı kontrol</span>
          <h2>Tarzı, tonu ve sahne hissini sen seç.</h2>
          <p>
            Macera, bilim kurgu, fantastik ya da duygusal bir anlatım oluşturabilir;
            görsel tarzı ve seslendirme karakterini hikâyenin ruhuna göre belirleyebilirsin.
          </p>
        </Card>
        <div className="feature-list">
          <Card className="feature-card">
            <h3>Sahne odaklı anlatım</h3>
            <p>Her hikâye izlenebilir bir akış için açılış, dönüm noktası ve final sahnesine ayrılır.</p>
          </Card>
          <Card className="feature-card">
            <h3>Temiz çalışma alanı</h3>
            <p>Karmaşık terimler yerine sadece hikâyene, sahnelerine ve üretim akışına odaklanırsın.</p>
          </Card>
        </div>
      </section>
    </>
  );
}
