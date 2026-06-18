import Link from "next/link";

const CARDS = [
  {
    barColor: "#FFC20E",
    iconBg: "rgba(255,194,14,0.1)",
    icon: "🏆",
    badgeBg: "rgba(0,210,106,0.1)",
    badgeBorder: "rgba(0,210,106,0.22)",
    badgeColor: "#00D26A",
    badgeText: "En développement",
    title: "SONAFRIK Awards",
    body: "La première cérémonie de récompenses musicales guinéennes entièrement décidée par les fans. Votez, suivez les classements en direct — les lauréats reçoivent leurs prix automatiquement.",
    pills: ["Artistes", "Auditeurs", "Fans Premium"],
  },
  {
    barColor: "#378ADD",
    iconBg: "rgba(55,138,221,0.1)",
    icon: "🎬",
    badgeBg: "rgba(255,255,255,0.06)",
    badgeBorder: "rgba(255,255,255,0.12)",
    badgeColor: "rgba(255,255,255,0.5)",
    badgeText: "Bientôt",
    title: "Espace Créateurs",
    body: "TikTokeurs, YouTubeurs, vlogeurs, blogueurs, podcasteurs — SONAFRIK ouvre un espace dédié où vous publiez vos contenus, construisez votre audience guinéenne et monétisez vos créations.",
    pills: ["TikTokeurs", "Podcasteurs", "Vlogeurs", "Blogueurs", "Influenceurs"],
  },
  {
    barColor: "#00D26A",
    iconBg: "rgba(0,210,106,0.1)",
    icon: "🫂",
    badgeBg: "rgba(255,255,255,0.06)",
    badgeBorder: "rgba(255,255,255,0.12)",
    badgeColor: "rgba(255,255,255,0.5)",
    badgeText: "Bientôt",
    title: "Fans Tribu",
    body: "Chaque artiste crée sa tribu de fans fidèles. Avant-premières, contenus exclusifs, sessions privées — les membres d'une tribu vivent l'artiste de l'intérieur.",
    pills: ["Artistes", "Fans Premium", "Communauté"],
  },
  {
    barColor: "#7F77DD",
    iconBg: "rgba(127,119,221,0.1)",
    icon: "🛍️",
    badgeBg: "rgba(255,255,255,0.06)",
    badgeBorder: "rgba(255,255,255,0.12)",
    badgeColor: "rgba(255,255,255,0.5)",
    badgeText: "Bientôt",
    title: "Marketplace SONAFRIK",
    body: "Merchandising, œuvres numériques, sessions studio, formations musicales — les artistes vendent directement, sans quitter l'application.",
    pills: ["Artistes", "Beatmakers", "Producteurs", "Auditeurs"],
  },
  {
    barColor: "#D85A30",
    iconBg: "rgba(216,90,48,0.1)",
    icon: "🎥",
    badgeBg: "rgba(255,255,255,0.06)",
    badgeBorder: "rgba(255,255,255,0.12)",
    badgeColor: "rgba(255,255,255,0.5)",
    badgeText: "Bientôt",
    title: "Lives & Événements",
    body: "Concerts en direct, sessions acoustiques, interviews. Les fans regardent, réagissent et envoient des pourboires en temps réel pendant le live.",
    pills: ["Artistes", "Organisateurs", "Médias", "Fans"],
  },
] as const;

export function LandingComingSoon() {
  return (
    <section style={{ marginBottom: "48px" }}>
      <p
        style={{
          fontSize: "11px",
          color: "rgba(255,255,255,0.28)",
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          textAlign: "center",
          marginBottom: "10px",
        }}
      >
        CE QUI ARRIVE BIENTÔT
      </p>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: 600,
          color: "#ffffff",
          textAlign: "center",
          marginBottom: "10px",
        }}
      >
        SONAFRIK, c&apos;est bien plus qu&apos;une appli de musique
      </h2>
      <p
        style={{
          fontSize: "14px",
          color: "rgba(255,255,255,0.4)",
          textAlign: "center",
          maxWidth: "600px",
          margin: "0 auto 28px",
          lineHeight: 1.6,
        }}
      >
        Chaque créateur — musicien, podcasteur, influenceur, vlogeur — trouvera sa place ici.
        Voici ce que nous construisons pour vous.
      </p>

      {/* Grille 5 cartes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
          gap: "14px",
          marginBottom: "14px",
        }}
      >
        {CARDS.map(({ barColor, iconBg, icon, badgeBg, badgeBorder, badgeColor, badgeText, title, body, pills }) => (
          <div
            key={title}
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
              padding: "22px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Barre top 2px */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                backgroundColor: barColor,
              }}
            />

            {/* Icône */}
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
                marginBottom: "12px",
              }}
            >
              {icon}
            </div>

            {/* Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: badgeBg,
                border: `0.5px solid ${badgeBorder}`,
                color: badgeColor,
                fontSize: "10px",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: "6px",
                marginBottom: "10px",
                marginLeft: "8px",
              }}
            >
              {badgeText}
            </div>

            <h3
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#ffffff",
                margin: "0 0 8px",
                clear: "both",
                display: "block",
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.6,
                margin: "0 0 14px",
              }}
            >
              {body}
            </p>

            {/* Pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {pills.map((pill) => (
                <span
                  key={pill}
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.4)",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "0.5px solid rgba(255,255,255,0.08)",
                    padding: "3px 8px",
                    borderRadius: "12px",
                  }}
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Encart créateurs */}
      <div
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          borderRadius: "14px",
          padding: "28px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "15px", fontWeight: 600, color: "#ffffff", margin: "0 0 8px" }}>
          Vous êtes créateur de contenu ?
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "rgba(255,255,255,0.42)",
            margin: "0 0 18px",
            lineHeight: 1.6,
          }}
        >
          Rejoignez la liste d&apos;attente des créateurs fondateurs. Les premiers inscrits auront un
          accès prioritaire et des conditions exclusives au lancement.
        </p>
        <Link
          href="/auth/inscription?role=creator"
          style={{
            display: "inline-block",
            backgroundColor: "#00D26A",
            color: "#0D0D0D",
            fontSize: "15px",
            fontWeight: 600,
            padding: "13px 28px",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Rejoindre la liste créateurs →
        </Link>
      </div>
    </section>
  );
}
