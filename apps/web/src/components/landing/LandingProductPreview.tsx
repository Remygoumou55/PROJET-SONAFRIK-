import { PlayerMockup } from "./PlayerMockup";
import { LandingSectionHeader } from "./LandingSectionHeader";

const BULLETS = [
  "Écoute fluide même en 3G — mode économie de données intégré",
  "65 % des abonnements reversés aux artistes que vous écoutez",
  "Pourboires et Beat Store — soutenez directement vos favoris",
] as const;

export function LandingProductPreview() {
  return (
    <section style={{ marginBottom: "56px" }}>
      <LandingSectionHeader
        label="APERÇU"
        title="Une vraie expérience musicale, pensée pour toi"
        subtitle="Voici SONAFRIK — pas une promesse, une interface réelle."
      />

      <div
        className="landing-product-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "32px",
          alignItems: "center",
        }}
      >
        <PlayerMockup />

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {BULLETS.map((text) => (
            <li
              key={text}
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                fontSize: "15px",
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.55,
              }}
            >
              <span
                style={{
                  color: "var(--color-vert-energie)",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ✓
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
