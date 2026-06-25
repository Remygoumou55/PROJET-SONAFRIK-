import { LandingSectionHeader } from "./LandingSectionHeader";

const COLUMNS = [
  {
    key: "now",
    icon: "✅",
    title: "DISPONIBLE MAINTENANT",
    borderColor: "var(--color-vert-energie)",
    itemColor: "var(--color-vert-energie)",
    items: [
      "Streaming musical",
      "Espace artiste complet",
      "Beat Store",
      "Pourboires directs",
      "Awards fans",
    ],
  },
  {
    key: "soon",
    icon: "🔜",
    title: "PROCHAINEMENT",
    borderColor: "var(--color-or-solaire)",
    itemColor: "var(--color-or-solaire)",
    items: ["Fan Tribu (commentaires, réactions)", "Marketplace musicale", "Lyrics synchronisées"],
  },
  {
    key: "vision",
    icon: "🔮",
    title: "VISION 2027",
    borderColor: "rgba(255,255,255,0.2)",
    itemColor: "rgba(255,255,255,0.45)",
    items: ["Distribution internationale", "IA musicale SONAFRIK", "Lives & Événements"],
  },
] as const;

export function Roadmap() {
  return (
    <section style={{ marginBottom: "56px" }}>
      <LandingSectionHeader
        label="ROADMAP"
        title="Ce que nous construisons ensemble"
        subtitle="SONAFRIK grandit avec vous"
      />

      <div
        className="landing-roadmap-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "14px",
        }}
      >
        {COLUMNS.map(({ key, icon, title, borderColor, itemColor, items }) => (
          <div
            key={key}
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderLeft: `3px solid ${borderColor}`,
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.5px",
                color: itemColor,
                margin: "0 0 14px",
              }}
            >
              {icon} {title}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {items.map((item) => (
                <li
                  key={item}
                  style={{
                    fontSize: "13px",
                    color: itemColor,
                    marginBottom: "8px",
                    lineHeight: 1.5,
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
