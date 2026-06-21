import { LandingSectionHeader } from "./LandingSectionHeader";

const PILLARS = [
  {
    iconBg: "rgba(0,210,106,0.12)",
    icon: "🎵",
    title: "65 % des abonnements pour les artistes",
    body: "Sur chaque abonnement payé, 65 francs sur 100 sont reversés aux artistes — répartis entre eux selon le nombre d'écoutes réelles.",
    note: "Plus votre musique est écoutée, plus votre part est grande. Chaque auditeur contribue à tous les artistes qu'il écoute.",
  },
  {
    iconBg: "rgba(255,194,14,0.12)",
    icon: "🎹",
    title: "Beat Store sans commission",
    body: "Les beatmakers vendent leurs instrumentaux directement sur SONAFRIK, car ils doivent aussi vivre de leur passion et de leurs œuvres.",
    note: "Zéro frais prélevés. Ce que l'acheteur paie vous revient intégralement.",
  },
  {
    iconBg: "rgba(55,138,221,0.12)",
    icon: "💸",
    title: "Pourboires directs aux artistes",
    body: "Quand un fan vous envoie un pourboire, la quasi-totalité lui arrive directement. Le geste du fan devient immédiatement de l'argent pour vous.",
    note: "Pas de délai, pas d'écran intermédiaire. Le geste du fan devient immédiatement de l'argent pour vous.",
  },
] as const;

export function LandingPillars() {
  return (
    <section style={{ marginBottom: "56px" }}>
      <LandingSectionHeader
        label="POURQUOI SONAFRIK"
        title="Construit pour les artistes guinéens"
      />

      {/* Texte intro */}
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto 32px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "17px", fontWeight: 600, color: "var(--color-texte-principal)", margin: 0 }}>
          En Guinée, des artistes talentueux créent chaque jour — et ne gagnent presque rien.
        </p>
        <p
          style={{
            fontSize: "15px",
            color: "rgba(255,255,255,0.45)",
            marginTop: "10px",
            marginBottom: 0,
          }}
        >
          SONAFRIK est né pour changer ça...
        </p>
      </div>

      {/* 3 cartes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
        }}
      >
        {PILLARS.map(({ iconBg, icon, title, body, note }) => (
          <div
            key={title}
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
              padding: "22px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: iconBg,
                fontSize: "20px",
                marginBottom: "14px",
              }}
            >
              {icon}
            </div>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--color-texte-principal)",
                margin: "0 0 8px",
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.5)",
                margin: "0 0 10px",
                lineHeight: 1.6,
              }}
            >
              {body}
            </p>
            <p
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.28)",
                borderTop: "0.5px solid rgba(255,255,255,0.06)",
                paddingTop: "10px",
                marginTop: "10px",
                marginBottom: 0,
                lineHeight: 1.5,
              }}
            >
              {note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
