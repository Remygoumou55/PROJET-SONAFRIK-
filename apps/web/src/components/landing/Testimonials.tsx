import { LandingSectionHeader } from "./LandingSectionHeader";

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
}

/** Remplir avec les témoignages des artistes fondateurs bêta — section masquée si vide. */
const TESTIMONIALS: Testimonial[] = [];

export function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section style={{ marginBottom: "56px" }}>
      <LandingSectionHeader label="TÉMOIGNAGES" title="Ils construisent SONAFRIK avec nous" />

      <div
        className="landing-testimonials-scroll scrollbar-hide"
        style={{
          display: "flex",
          gap: "14px",
          overflowX: "auto",
          paddingBottom: "8px",
        }}
      >
        {TESTIMONIALS.map(({ name, role, quote, initials, avatarBg, avatarColor }) => (
          <article
            key={name}
            style={{
              flex: "0 0 min(300px, 85vw)",
              backgroundColor: "var(--color-surface)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: avatarBg,
                  color: avatarColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                {initials}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--color-texte-principal)" }}>
                  {name}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>{role}</p>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, fontStyle: "italic" }}>
              &ldquo;{quote}&rdquo;
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
