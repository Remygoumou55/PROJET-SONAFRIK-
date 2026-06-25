import { LandingSectionHeader } from "./LandingSectionHeader";

const FAQ_ITEMS = [
  {
    q: "SONAFRIK est-il déjà disponible ?",
    a: "Nous sommes en phase de lancement communautaire. Dès que 2 000 abonnés sont atteints, la plateforme ouvre officiellement à tous.",
  },
  {
    q: "Comment les artistes sont-ils payés ?",
    a: "65 % de chaque abonnement est partagé entre les artistes que vous écoutez, au prorata des écoutes réelles. Les retraits se font via Orange Money ou MTN MoMo.",
  },
  {
    q: "Quels moyens de paiement sont acceptés ?",
    a: "Orange Money et MTN MoMo en Guinée. Le pack Diaspora (5 EUR/mois) accepte carte bancaire et PayPal.",
  },
  {
    q: "Puis-je écouter hors connexion ?",
    a: "Oui, les formules hebdomadaire, mensuelle et annuelle incluent le mode hors ligne et l'économie de données.",
  },
  {
    q: "Comment créer un compte artiste ?",
    a: "Cliquez sur « Rejoindre », entrez votre numéro guinéen (+224), validez le code SMS et choisissez le profil Artiste.",
  },
] as const;

export function LandingFAQ() {
  return (
    <section id="faq" style={{ marginBottom: "56px", scrollMarginTop: "88px" }}>
      <LandingSectionHeader label="FAQ" title="Questions fréquentes" />

      <div
        className="landing-faq-list"
        style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "8px" }}
      >
        {FAQ_ITEMS.map(({ q, a }, index) => (
          <details
            key={q}
            className="landing-faq-item"
            open={index === 0}
            style={{
              borderRadius: "12px",
              border: "1px solid var(--color-bordure)",
              backgroundColor: "rgba(255,255,255,0.02)",
              overflow: "hidden",
            }}
          >
            <summary
              className="landing-faq-summary"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                padding: "16px 18px",
                cursor: "pointer",
                listStyle: "none",
                color: "var(--color-texte-principal)",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              {q}
            </summary>
            <p
              style={{
                margin: 0,
                padding: "0 18px 16px",
                fontSize: "14px",
                color: "var(--color-texte-secondaire)",
                lineHeight: 1.65,
              }}
            >
              {a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
