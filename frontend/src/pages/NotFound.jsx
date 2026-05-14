import EmptyState from "../components/ui/EmptyState.jsx";
import PageShell from "../components/layout/PageShell.jsx";

export default function NotFound() {
  return (
    <PageShell title="Sayfa bulunamadı">
      <EmptyState
        title="Aradığın sayfa yok"
        description="Ana sayfaya dönerek StoryVision AI stüdyosunda devam edebilirsin."
        actionLabel="Yeni Hikâye Oluştur"
      />
    </PageShell>
  );
}
