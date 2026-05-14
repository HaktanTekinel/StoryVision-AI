import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";

function getStatusLabel(isReady, isBusy) {
  if (isBusy) return "Hazırlanıyor";
  if (isReady) return "Hazır";
  return "Bekliyor";
}

export default function MediaPreview({ story, busyStep, onGenerate }) {
  const images = story.images || story.visuals || [];
  const audioUrl = story.audioUrl || story.audioPath || story.voiceUrl;
  const videoUrl = story.videoUrl || story.videoPath;
  const subtitlesReady = Boolean(story.subtitleUrl || story.subtitlePath || story.production?.subtitles);

  const productionItems = [
    {
      key: "images",
      title: "Görseller",
      description: "Hikâyeye uygun sahne görselleri hazırlanır.",
      action: "Görselleri Hazırla",
      isReady: images.length > 0 || story.production?.visuals,
    },
    {
      key: "audio",
      title: "Seslendirme",
      description: `${story.narrator || "Seçilen anlatıcı"} tarzıyla hikâyeye anlatıcı sesi hazırlanır.`,
      action: "Seslendirmeyi Hazırla",
      isReady: Boolean(audioUrl || story.production?.voice),
    },
    {
      key: "video",
      title: "Video",
      description: "Sahneler, seslendirme ve akış tek bir izlenebilir videoya dönüşür.",
      action: "Videoyu Oluştur",
      isReady: Boolean(videoUrl || story.production?.video),
    },
    {
      key: "subtitles",
      title: "Altyazı",
      description: "Hikâye metni izleme deneyimine uygun şekilde videoya eklenir.",
      action: "Altyazıyı Hazırla",
      isReady: subtitlesReady,
    },
  ];

  return (
    <div className="media-preview-grid">
      {productionItems.map((item) => {
        const isBusy = busyStep === item.key;
        const isReady = Boolean(item.isReady);

        return (
          <article className="media-box" key={item.key}>
            <div>
              <Badge variant={isReady ? "success" : "soft"}>{getStatusLabel(isReady, isBusy)}</Badge>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onGenerate(item.key)}
              disabled={isReady || isBusy}
            >
              {isBusy ? "Hazırlanıyor..." : isReady ? "Tamamlandı" : item.action}
            </Button>
          </article>
        );
      })}
    </div>
  );
}