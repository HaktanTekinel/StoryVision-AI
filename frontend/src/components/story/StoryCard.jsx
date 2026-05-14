import { Link } from "react-router-dom";
import Badge from "../ui/Badge.jsx";
import Card from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import { formatDate } from "../../utils/date.js";
import { getStoryId } from "../../services/storyService.js";

function getStorySummary(story) {
  return story.synopsis || story.summary || story.description || "Hikâye detaylarını görüntülemek için kartı aç.";
}

function getVideoStatus(story) {
  if (story.videoUrl || story.videoPath || story.production?.video || story.mediaStatus?.video === "ready") {
    return "Video hazır";
  }

  if (story.mediaStatus?.video === "processing") {
    return "Video hazırlanıyor";
  }

  return "Video bekliyor";
}

export default function StoryCard({ story }) {
  const storyId = getStoryId(story);
  const createdAt = story.createdAt || story.created_at;

  return (
    <Card className="story-card">
      <div className="story-card-top">
        <Badge>{story.genre || "Hikâye"}</Badge>
        <span>{createdAt ? formatDate(createdAt) : "Yeni"}</span>
      </div>

      <h2>{story.title || "Başlıksız Hikâye"}</h2>
      <p>{getStorySummary(story)}</p>

      <div className="story-card-meta">
        <span>{story.tone || "Anlatım"}</span>
        <span>{story.visualStyle || story.visual_style || "Görsel tarz"}</span>
        <span>{getVideoStatus(story)}</span>
      </div>

      <Button as={Link} to={`/stories/${storyId}`} variant="secondary">
        Hikâyeyi Aç
      </Button>
    </Card>
  );
}