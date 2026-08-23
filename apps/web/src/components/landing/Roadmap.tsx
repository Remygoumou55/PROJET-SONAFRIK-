import { LandingSectionHeader } from "./LandingSectionHeader";

const COLUMNS = [
  {
    key: "now",
    icon: "✅",
    title: "DISPONIBLE MAINTENANT",
    borderClass: "border-l-vert-energie",
    textClass: "text-[var(--t8-primary-lavender)]",
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
    borderClass: "border-l-or-solaire",
    textClass: "text-[var(--t8-primary-lavender)]",
    items: ["Fan Tribu (commentaires, réactions)", "Marketplace musicale", "Lyrics synchronisées"],
  },
  {
    key: "vision",
    icon: "🔮",
    title: "VISION 2027",
    borderClass: "border-l-white/20",
    textClass: "text-white/45",
    items: ["Distribution internationale", "IA musicale SONAFRIK", "Lives & Événements"],
  },
] as const;

export function Roadmap() {
  return (
    <section className="mb-14">
      <LandingSectionHeader
        label="ROADMAP"
        title="Ce que nous construisons ensemble"
        subtitle="SONAFRIK grandit avec vous"
      />

      <div className="landing-roadmap-grid grid grid-cols-3 gap-3.5">
        {COLUMNS.map(({ key, icon, title, borderClass, textClass, items }) => (
          <div
            key={key}
            className={`rounded-[14px] border border-white/10 border-l-[3px] bg-white/[0.03] p-5 ${borderClass}`}
          >
            <p className={`mb-3.5 text-[11px] font-bold tracking-wide ${textClass}`}>
              {icon} {title}
            </p>
            <ul className="m-0 list-none p-0">
              {items.map((item) => (
                <li key={item} className={`mb-2 text-[13px] leading-snug ${textClass}`}>
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
