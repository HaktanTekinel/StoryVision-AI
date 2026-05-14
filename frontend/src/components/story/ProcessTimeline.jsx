const steps = [
  {
    title: "Fikir",
    description: "Kısa bir düşünce veya karakterden yola çıkılır.",
  },
  {
    title: "Hikâye",
    description: "Anlatım, karakter ve atmosfer tek bir akışta birleşir.",
  },
  {
    title: "Sahne",
    description: "Hikâyenin önemli anları görsel sahnelere ayrılır.",
  },
  {
    title: "Video",
    description: "Ses, sahneler ve altyazı izlenebilir bir deneyime dönüşür.",
  },
];

export default function ProcessTimeline() {
  return (
    <div className="timeline-grid">
      {steps.map((step, index) => (
        <article className="timeline-card" key={step.title}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
        </article>
      ))}
    </div>
  );
}
