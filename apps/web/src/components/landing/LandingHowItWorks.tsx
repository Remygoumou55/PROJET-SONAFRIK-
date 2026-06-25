import { PlayerMockup } from "./PlayerMockup";
import { LandingSectionHeader } from "./LandingSectionHeader";

const STEPS = [
  {
    number: "1",
    title: "Créez votre compte",
    body: "Artiste ou auditeur — deux minutes, votre numéro guinéen suffit.",
  },
  {
    number: "2",
    title: "Choisissez votre formule",
    body: "Journalier, mensuel ou annuel — payez via Orange Money ou MTN MoMo.",
  },
  {
    number: "3",
    title: "Écoutez ou publiez",
    body: "Chaque écoute génère des royalties. Les artistes retirent sur mobile money.",
  },
] as const;

const HIGHLIGHTS = [
  "Écoute fluide en 3G — économie de données intégrée",
  "65 % des abonnements reversés aux artistes écoutés",
  "Pourboires et Beat Store — soutien direct aux créateurs",
] as const;

export function LandingHowItWorks() {
  return (
    <section id="comment-ca-marche" style={{ marginBottom: "56px", scrollMarginTop: "88px" }}>
      <LandingSectionHeader
        label="APERÇU"
        title="Une vraie expérience musicale, pensée pour toi"
        subtitle="Voici SONAFRIK — interface réelle, pas une promesse."
      />

      <div className="landing-how-grid">
        <div className="landing-how-mockup">
          <PlayerMockup />
        </div>

        <div className="landing-how-steps">
          {STEPS.map(({ number, title, body }, index) => (
            <div
              key={number}
              className="landing-how-step"
              style={{
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
                marginBottom: index < STEPS.length - 1 ? "24px" : 0,
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 700,
                  backgroundColor:
                    index === 0 ? "var(--color-vert-energie)" : "var(--color-surface)",
                  color:
                    index === 0 ? "var(--color-noir-profond)" : "var(--color-texte-principal)",
                  border:
                    index === 0 ? "none" : "1px solid var(--color-bordure)",
                }}
              >
                {number}
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--color-texte-principal)",
                    margin: "0 0 6px",
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--color-texte-secondaire)",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {body}
                </p>
              </div>
            </div>
          ))}

          <ul
            style={{
              listStyle: "none",
              padding: "20px 0 0",
              margin: "20px 0 0",
              borderTop: "1px solid var(--color-bordure)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {HIGHLIGHTS.map((text) => (
              <li
                key={text}
                style={{
                  display: "flex",
                  gap: "10px",
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: "var(--color-vert-energie)", fontWeight: 700 }}>✓</span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
