import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import PageShell from "../components/layout/PageShell.jsx";
import StoryCard from "../components/story/StoryCard.jsx";
import { getStories, getStoryId } from "../services/storyService.js";

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStories() {
      try {
        setError("");
        const result = await getStories();
        setStories(result);
      } catch (err) {
        setError(err.message || "Hikâyeler alınamadı.");
      } finally {
        setIsLoading(false);
      }
    }

    loadStories();
  }, []);

  return (
    <PageShell
      eyebrow="Kütüphane"
      title="Hikâyelerim"
      description="Oluşturduğun hikâyeleri, sahneleri ve üretim durumunu buradan takip edebilirsin."
      actions={
        <Button as={Link} to="/create" size="sm">
          Yeni Hikâye
        </Button>
      }
    >
      {isLoading && <Card className="loading-card">Hikâyeler yükleniyor...</Card>}

      {!isLoading && error && (
        <EmptyState title="Hikâyeler alınamadı" description={error} actionLabel="Yeni Hikâye Oluştur" />
      )}

      {!isLoading && !error && stories.length === 0 && (
        <EmptyState
          title="Henüz hikâye yok"
          description="İlk fikrini yaz ve StoryVision AI stüdyosunda yeni bir hikâye başlat."
        />
      )}

      {!isLoading && !error && stories.length > 0 && (
        <div className="story-grid">
          {stories.map((story) => (
            <StoryCard key={getStoryId(story)} story={story} />
          ))}
        </div>
      )}
    </PageShell>
  );
}