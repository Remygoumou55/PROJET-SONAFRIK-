import Link from "next/link";

const COLUMNS = [
  {
    title: "Produit",
    links: [
      { label: "Comment ça marche", href: "#comment-ca-marche" },
      { label: "Tarifs", href: "#tarifs" },
      { label: "Artistes fondateurs", href: "#artistes" },
    ],
  },
  {
    title: "Communauté",
    links: [
      { label: "Rejoindre", href: "/auth/connexion" },
      { label: "Devenir artiste", href: "/auth/connexion?role=artist" },
      { label: "Page lancement", href: "/lancement" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Conditions générales", href: "/legal/terms" },
      { label: "Confidentialité", href: "/legal/privacy" },
      { label: "FAQ", href: "#faq" },
    ],
  },
] as const;

export function LandingFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--color-bordure)",
        paddingTop: "40px",
        marginTop: "8px",
      }}
    >
      <div
        className="landing-footer-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr repeat(3, 1fr)",
          gap: "32px",
          marginBottom: "32px",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "18px",
              fontWeight: 600,
              letterSpacing: "3px",
              margin: "0 0 8px",
            }}
          >
            <span style={{ color: "var(--color-texte-principal)" }}>SON</span>
            <span style={{ color: "var(--color-or-solaire)" }}>A</span>
            <span style={{ color: "var(--color-vert-energie)" }}>FRIK</span>
          </p>
          <p style={{ fontSize: "13px", color: "var(--color-texte-secondaire)", lineHeight: 1.6, margin: 0 }}>
            La musique guinéenne mérite sa plateforme.
            <br />
            Notre Bien Commun.
          </p>
        </div>

        {COLUMNS.map(({ title, links }) => (
          <div key={title}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: "var(--color-texte-secondaire)",
                margin: "0 0 12px",
              }}
            >
              {title}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {links.map(({ label, href }) => (
                <li key={label} style={{ marginBottom: "8px" }}>
                  <Link
                    href={href}
                    style={{
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.55)",
                      textDecoration: "none",
                    }}
                    className="landing-footer-link"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p
        style={{
          fontSize: "12px",
          color: "var(--color-texte-desactive)",
          textAlign: "center",
          margin: 0,
          paddingBottom: "24px",
        }}
      >
        © {new Date().getFullYear()} SONAFRIK — Guinée Conakry. Tous droits réservés.
      </p>
    </footer>
  );
}
