import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreationForm from "../components/story/CreationForm.jsx";
import Card from "../components/ui/Card.jsx";
import PageShell from "../components/layout/PageShell.jsx";
import { createStory, getStoryId } from "../services/storyService.js";

export default function CreateStory() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateStory(form) {
    try {
      setError("");
      setIsSubmitting(true);

      const story = await createStory(form);
      const storyId = getStoryId(story);

      if (!storyId) {
        throw new Error("Hikâye oluşturuldu ancak detay bilgisi alınamadı.");
      }

      navigate(`/stories/${storyId}`);
    } catch (err) {
      setError(err.message || "Hikâye oluşturulamadı.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell
      eyebrow="Yeni çalışma"
      title="Hikâyeni tasarlamaya başla"
      description="Bir fikir yaz, karakteri ve atmosferi seç; StoryVision AI bunu sinematik bir anlatı akışına dönüştürsün."
    >
      <Card className="form-card">
        {error && <div className="form-error">{error}</div>}
        <CreationForm onSubmit={handleCreateStory} isSubmitting={isSubmitting} />
      </Card>
    </PageShell>
  );
}