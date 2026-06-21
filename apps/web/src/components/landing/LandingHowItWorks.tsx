import { LandingSectionHeader } from "./LandingSectionHeader";

const STEPS = [
  {
    number: "1",
    green: true,
    title: "Vous créez votre compte",
    body: "Artiste ou auditeur — deux minutes, numéro de téléphone guinéen suffit.",
  },
  {
    number: "2",
    green: false,
    title: "Vous écoutez ou publiez",
    body: "Chaque écoute génère des points de royalties. Chaque upload est modéré puis mis en ligne.",
  },
  {
    number: "3",
    green: false,
    title: "L'argent circule",
    body: "Les artistes retirent leurs revenus sur Orange Money ou MTN directement depuis l'app.",
  },
] as const;

export function LandingHowItWorks() {
  return (
    <section style={{ marginBottom: "56px" }}>
      <LandingSectionHeader label="COMMENT ÇA MARCHE" title="Simple comme bonjour" />

      <div
        className="landing-steps-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "24px",
          position: "relative",
        }}
      >
        {/* Ligne horizontale de connexion */}
        <div
          className="landing-steps-connector"
          style={{
            position: "absolute",
            top: "19px",
            left: "calc(50% / 3)",
            right: "calc(50% / 3)",
            height: "0.5px",
            backgroundColor: "rgba(255,255,255,0.07)",
            zIndex: 0,
          }}
        />

        {STEPS.map(({ number, green, title, body }) => (
          <div
            key={number}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "15px",
                fontWeight: 600,
                marginBottom: "14px",
                flexShrink: 0,
                ...(green
                  ? { backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }
                  : {
                      backgroundColor: "rgba(255,255,255,0.04)",
                      border: "0.5px solid rgba(255,255,255,0.14)",
                      color: "var(--color-texte-principal)",
                    }),
              }}
            >
              {number}
            </div>
            <h3
              style={{
                fontSize: "14px",
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
                color: "rgba(255,255,255,0.45)",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
