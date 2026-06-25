import { LandingSectionHeader } from "./LandingSectionHeader";

const ARTISTS = [
  { initials: "AD", name: "Alpha Diallo", genre: "Afrobeat",     bg: "rgba(15, 110, 86, 1)",   text: "rgba(159, 225, 203, 1)" },
  { initials: "F",  name: "Faya",         genre: "R&B Africain", bg: "rgba(12, 68, 124, 1)",   text: "rgba(181, 212, 244, 1)" },
  { initials: "DS", name: "Djeli Sow",    genre: "Traditionnel", bg: "rgba(60, 52, 137, 1)",   text: "rgba(206, 203, 246, 1)" },
  { initials: "MF", name: "MC Fly",       genre: "Rap GN",       bg: "rgba(99, 68, 0, 1)",     text: "rgba(250, 199, 117, 1)" },
  { initials: "S",  name: "SeK",          genre: "Gospel",        bg: "rgba(59, 34, 18, 1)",    text: "rgba(245, 196, 179, 1)" },
] as const;

export function LandingArtists() {
  return (
    <section id="artistes" style={{ marginBottom: "56px", textAlign: "center", scrollMarginTop: "88px" }}>
      <LandingSectionHeader label="DÉJÀ SUR SONAFRIK" title="Les artistes fondateurs" />

      {/* Cartes artistes */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {ARTISTS.map(({ initials, name, genre, bg, text }) => (
          <div
            key={name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
              padding: "12px 16px",
              minWidth: "160px",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                backgroundColor: bg,
                color: text,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ textAlign: "left" }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-texte-principal)",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {name}
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.4)",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {genre}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pill de stats */}
      <div
        style={{
          display: "inline-block",
          backgroundColor: "rgba(255,255,255,0.04)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          padding: "7px 16px",
          borderRadius: "20px",
          fontSize: "12px",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        🎵 5 artistes · 30 morceaux · Guinée Conakry
      </div>
    </section>
  );
}
