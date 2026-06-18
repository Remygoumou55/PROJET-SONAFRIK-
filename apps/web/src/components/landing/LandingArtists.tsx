import { LandingSectionHeader } from "./LandingSectionHeader";

const ARTISTS = [
  { initials: "AD", name: "Alpha Diallo", genre: "Afrobeat",     bg: "#0F6E56", text: "#9FE1CB" },
  { initials: "F",  name: "Faya",         genre: "R&B Africain", bg: "#0C447C", text: "#B5D4F4" },
  { initials: "DS", name: "Djeli Sow",    genre: "Traditionnel", bg: "#3C3489", text: "#CECBF6" },
  { initials: "MF", name: "MC Fly",        genre: "Rap GN",      bg: "#634400", text: "#FAC775" },
  { initials: "S",  name: "SeK",           genre: "Gospel",       bg: "#3B2212", text: "#F5C4B3" },
] as const;

export function LandingArtists() {
  return (
    <section style={{ marginBottom: "56px", textAlign: "center" }}>
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
                  color: "#ffffff",
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
