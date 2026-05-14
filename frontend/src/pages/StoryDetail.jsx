import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import MediaPreview from "../components/story/MediaPreview.jsx";
import PageShell from "../components/layout/PageShell.jsx";
import {
  deleteStory,
  generateStoryAudio,
  generateStoryImages,
  generateStorySubtitles,
  generateStoryVideo,
  getStoryById,
} from "../services/storyService.js";
import { formatDate } from "../utils/date.js";

function getParagraphs(story) {
  if (Array.isArray(story.paragraphs)) return story.paragraphs;
  if (Array.isArray(story.content)) return story.content;
  if (story.text) return story.text.split("\n").filter(Boolean);
  if (story.content) return String(story.content).split("\n").filter(Boolean);
  return [];
}

function getScenes(story) {
  return story.scenes || story.images || story.visuals || [];
}

function getImageUrl(scene) {
  return scene.url || scene.imageUrl || scene.path || scene.filePath;
}

function getAudioUrl(story) {
  return story.audioUrl || story.audioPath || story.voiceUrl;
}

function getVideoUrl(story) {
  return story.videoUrl || story.videoPath;
}

export default function StoryDetail() {
  const { storyId } = useParams();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyStep, setBusyStep] = useState("");
  const [error, setError] = useState("");

  async function loadStory() {
    const result = await getStoryById(storyId);
    setStory(result);
  }

  useEffect(() => {
    async function run() {
      try {
        setError("");
        await loadStory();
      } catch (err) {
        setError(err.message || "Hikâye yüklenemedi.");
      } finally {
        setIsLoading(false);
      }
    }

    run();
  }, [storyId]);

  const paragraphs = useMemo(() => (story ? getParagraphs(story) : []), [story]);
  const scenes = useMemo(() => (story ? getScenes(story) : []), [story]);
  const audioUrl = story ? getAudioUrl(story) : "";
  const videoUrl = story ? getVideoUrl(story) : "";

  async function handleGenerate(step) {
    const actions = {
      images: generateStoryImages,
      audio: generateStoryAudio,
      video: generateStoryVideo,
      subtitles: generateStorySubtitles,
    };

    try {
      setError("");
      setBusyStep(step);
      await actions[step](storyId);
      await loadStory();
    } catch (err) {
      setError(err.message || "İşlem tamamlanamadı.");
    } finally {
      setBusyStep("");
    }
  }

  async function handleDelete() {
    try {
      await deleteStory(storyId);
      navigate("/stories");
    } catch (err) {
      setError(err.message || "Hikâye silinemedi.");
    }
  }

  if (isLoading) {
    return (
      <PageShell title="Hikâye yükleniyor" description="Çalışma alanın hazırlanıyor...">
        <Card className="loading-card">Lütfen bekle.</Card>
      </PageShell>
    );
  }

  if (error && !story) {
    return (
      <PageShell title="Hikâye yüklenemedi">
        <EmptyState title="Hikâye bilgisi alınamadı" description={error} />
      </PageShell>
    );
  }

  if (!story) {
    return (
      <PageShell title="Hikâye bulunamadı">
        <EmptyState
          title="Bu hikâye artık burada değil"
          description="Yeni bir hikâye oluşturarak stüdyoya devam edebilirsin."
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Hikâye çalışma alanı"
      title={story.title || "Başlıksız Hikâye"}
      description={story.synopsis || story.summary || "Hikâyenin üretim akışını buradan takip edebilirsin."}
      actions={
        <div className="detail-actions">
          <Button as={Link} to="/stories" variant="secondary" size="sm">
            Kütüphaneye Dön
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleDelete}>
            Sil
          </Button>
        </div>
      }
    >
      {error && <Card className="form-error">{error}</Card>}

      <div className="detail-layout">
        <Card className="story-reader">
          <div className="reader-meta">
            <Badge>{story.genre || "Hikâye"}</Badge>
            {story.tone && <Badge>{story.tone}</Badge>}
            {(story.createdAt || story.created_at) && <span>{formatDate(story.createdAt || story.created_at)}</span>}
          </div>

          <h2>Hikâye Metni</h2>

          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
          ) : (
            <p>Hikâye metni henüz alınamadı.</p>
          )}
        </Card>

        <aside className="story-sidebar">
          <Card className="mini-panel">
            <span>Karakter</span>
            <strong>{story.character || "Belirtilmedi"}</strong>
          </Card>

          <Card className="mini-panel">
            <span>Mekân</span>
            <strong>{story.place || "Belirtilmedi"}</strong>
          </Card>

          <Card className="mini-panel">
            <span>Görsel Tarz</span>
            <strong>{story.visualStyle || story.visual_style || "Belirtilmedi"}</strong>
          </Card>
        </aside>
      </div>

      <section className="content-section no-padding-top">
        <div className="section-title compact">
          <span className="eyebrow">Sahne tasarımı</span>
          <h2>Hikâyenin görsel akışı</h2>
        </div>

        {scenes.length === 0 ? (
          <Card className="loading-card">Bu hikâye için görseller henüz hazırlanmadı.</Card>
        ) : (
          <div className="scene-grid">
            {scenes.map((scene, index) => {
              const imageUrl = getImageUrl(scene);

              return (
                <article className="scene-card" key={scene.id || scene.title || imageUrl || index}>
                  <div className="scene-image">
                    {imageUrl ? (
                      <img src={imageUrl} alt={scene.title || `Sahne ${index + 1}`} />
                    ) : (
                      <span>{scene.title || `Sahne ${index + 1}`}</span>
                    )}
                  </div>

                  <div className="scene-body">
                    {(scene.mood || scene.status) && <Badge>{scene.mood || scene.status}</Badge>}
                    <h3>{scene.title || `Sahne ${index + 1}`}</h3>
                    <p>{scene.description || scene.prompt || "Sahne açıklaması henüz alınamadı."}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="content-section no-padding-top">
        <div className="section-title compact">
          <span className="eyebrow">Stüdyo akışı</span>
          <h2>Ses, video ve altyazı</h2>
        </div>

        <MediaPreview story={story} busyStep={busyStep} onGenerate={handleGenerate} />

        {audioUrl && (
          <Card className="loading-card">
            <h3>Seslendirme</h3>
            <audio controls src={audioUrl} />
          </Card>
        )}

        {videoUrl && (
          <Card className="loading-card">
            <h3>Video</h3>
            <video controls src={videoUrl} className="video-player" />
          </Card>
        )}
      </section>
    </PageShell>
  );
}