const stats = [
  { value: "3", label: "sahne tasarımı" },
  { value: "4", label: "yaratıcı aşama" },
  { value: "1", label: "sinematik akış" },
];

export default function StatsStrip() {
  return (
    <div className="stats-strip">
      {stats.map((item) => (
        <div key={item.label}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
