import Link from "next/link";
import { LandingSectionHeader } from "./LandingSectionHeader";

const PAYMENT_ORANGE = {
  dot: "var(--color-provider-orange)",
  name: "Orange Money",
  sub: "Instantané · Partout en Guinée",
  detail: "Depuis votre téléphone",
};

const PAYMENT_MTN = {
  dot: "var(--color-provider-mtn)",
  name: "MTN Mobile Money",
  sub: "Instantané · Partout en Guinée",
  detail: "Depuis votre téléphone",
};

const PAYMENT_ORANGE_ANNUAL = {
  dot: "var(--color-provider-orange)",
  name: "Orange",
  sub: "Unique ou en 2 fois · Instantané",
  detail: "Paiement fractionné disponible",
};

const PAYMENT_MTN_ANNUAL = {
  dot: "var(--color-provider-mtn)",
  name: "MTN",
  sub: "Unique ou en 2 fois · Instantané",
  detail: "Paiement fractionné disponible",
};

const PAYMENT_CARD = {
  dot: "var(--color-feature-navy)",
  name: "Carte bancaire",
  sub: "Visa, Mastercard · Sécurisé",
  detail: "Pour membres hors Guinée",
};

type Feature = { ok: boolean; text: string };
type Payment = { dot: string; name: string; sub: string; detail: string };

interface Plan {
  badgeColor: string;
  badgeBg: string;
  badgeText: string;
  title: string;
  price: string;
  period: string;
  saving?: string;
  tagline: string;
  features: Feature[];
  payments: Payment[];
  featured?: boolean;
}

const PLANS: Plan[] = [
  {
    badgeBg: "rgba(255,255,255,0.06)",
    badgeColor: "rgba(255,255,255,0.5)",
    badgeText: "Journalier",
    title: "Journalier",
    price: "5 000 GNF",
    period: "/ jour",
    tagline: "Accès complet pour une journée.",
    features: [
      { ok: true,  text: "Écoute illimitée + hors ligne" },
      { ok: true,  text: "Réactions illimitées" },
      { ok: true,  text: "1 vote Awards" },
      { ok: false, text: "Cloud personnel" },
    ],
    payments: [PAYMENT_ORANGE, PAYMENT_MTN],
  },
  {
    badgeBg: "rgba(255,255,255,0.06)",
    badgeColor: "rgba(255,255,255,0.5)",
    badgeText: "Hebdomadaire",
    title: "Hebdomadaire",
    price: "25 000 GNF",
    period: "/ semaine",
    saving: "−5 000 GNF vs journalier",
    tagline: "Une semaine entière, sans interruption.",
    features: [
      { ok: true,  text: "Écoute illimitée + hors ligne" },
      { ok: true,  text: "Réactions illimitées" },
      { ok: true,  text: "3 votes Awards / jour" },
      { ok: true,  text: "Cloud personnel 2 GB" },
    ],
    payments: [PAYMENT_ORANGE, PAYMENT_MTN],
  },
  {
    badgeBg: "rgba(0,210,106,0.12)",
    badgeColor: "var(--color-vert-energie)",
    badgeText: "Le plus populaire",
    title: "Mensuel",
    price: "80 000 GNF",
    period: "/ mois",
    saving: "−70 000 GNF vs journalier",
    tagline: "L'expérience complète, le meilleur rapport.",
    features: [
      { ok: true, text: "Écoute illimitée + hors ligne" },
      { ok: true, text: "Réactions illimitées" },
      { ok: true, text: "5 votes Awards / jour" },
      { ok: true, text: "Cloud personnel 5 GB" },
      { ok: true, text: "Accès aux fonctions Bêta" },
    ],
    payments: [PAYMENT_ORANGE, PAYMENT_MTN],
    featured: true,
  },
  {
    badgeBg: "rgba(255,194,14,0.12)",
    badgeColor: "var(--color-or-solaire)",
    badgeText: "Meilleure valeur",
    title: "Annuel",
    price: "700 000 GNF",
    period: "/ an",
    saving: "2 mois offerts vs mensuel",
    tagline: "Engagez-vous un an, économisez deux mois.",
    features: [
      { ok: true, text: "Tout ce qu'inclut le mensuel" },
      { ok: true, text: "Cloud personnel 10 GB" },
      { ok: true, text: "Badge \"Fidèle SONAFRIK\"" },
      { ok: true, text: "Accès prioritaire nouveautés" },
    ],
    payments: [PAYMENT_ORANGE_ANNUAL, PAYMENT_MTN_ANNUAL, PAYMENT_CARD],
  },
];

function PaymentItem({ dot, name, sub, detail }: Payment) {
  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: "8px",
        padding: "8px 10px",
        marginBottom: "6px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: dot,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-texte-principal)" }}>{name}</span>
      </div>
      <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", margin: "0 0 1px 14px" }}>{sub}</p>
      <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.28)", margin: "0 0 0 14px" }}>{detail}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "9px",
        color: "rgba(255,255,255,0.28)",
        textTransform: "uppercase",
        letterSpacing: "1px",
        margin: "0 0 8px",
      }}
    >
      {children}
    </p>
  );
}

function PlanSubscribeLink({ featured = false }: { featured?: boolean }) {
  return (
    <Link
      href="/auth/connexion?role=listener"
      style={{
        display: "block",
        marginTop: "14px",
        padding: "11px 16px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        textAlign: "center",
        textDecoration: "none",
        backgroundColor: featured ? "var(--color-vert-energie)" : "transparent",
        color: featured ? "var(--color-noir-profond)" : "var(--color-texte-principal)",
        border: featured ? "none" : "0.5px solid rgba(255,255,255,0.2)",
      }}
    >
      S&apos;abonner →
    </Link>
  );
}

export function LandingPlans() {
  return (
    <section id="tarifs" style={{ marginBottom: "28px", scrollMarginTop: "88px" }}>
      <LandingSectionHeader label="ABONNEMENTS" title="Choisissez votre formule" />

      {/* Grille 4 formules */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "14px",
          marginBottom: "14px",
        }}
        className="landing-plans-grid"
      >
        {PLANS.map((plan) => (
          <div
            key={plan.title}
            style={{
              backgroundColor: plan.featured ? "rgba(0,210,106,0.04)" : "rgba(255,255,255,0.03)",
              border: plan.featured
                ? "1.5px solid var(--color-vert-energie)"
                : "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Badge */}
            <div
              style={{
                display: "inline-flex",
                alignSelf: "flex-start",
                backgroundColor: plan.badgeBg,
                color: plan.badgeColor,
                fontSize: "10px",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: "6px",
                marginBottom: "10px",
              }}
            >
              {plan.badgeText}
            </div>

            {/* Titre + prix */}
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-texte-principal)", margin: "0 0 4px" }}>
              {plan.title}
            </p>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-texte-principal)", margin: "0 0 2px" }}>
              {plan.price}{" "}
              <span style={{ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>
                {plan.period}
              </span>
            </p>
            {plan.saving && (
              <p style={{ fontSize: "11px", color: "var(--color-vert-energie)", margin: "0 0 8px" }}>
                {plan.saving}
              </p>
            )}
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: "0 0 12px", lineHeight: 1.4 }}>
              {plan.tagline}
            </p>

            <hr style={{ border: "none", borderTop: "0.5px solid rgba(255,255,255,0.06)", margin: "0 0 10px" }} />

            {/* Features */}
            <SectionLabel>CE QUE VOUS AVEZ</SectionLabel>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 12px", flexGrow: 1 }}>
              {plan.features.map((f) => (
                <li key={f.text} style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "6px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: f.ok ? "var(--color-vert-energie)" : "rgba(255,255,255,0.18)",
                      lineHeight: "1.5",
                      flexShrink: 0,
                    }}
                  >
                    {f.ok ? "✓" : "✗"}
                  </span>
                  <span style={{ fontSize: "12px", color: f.ok ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.28)", lineHeight: 1.5 }}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>

            <hr style={{ border: "none", borderTop: "0.5px solid rgba(255,255,255,0.06)", margin: "0 0 10px" }} />

            {/* Paiements */}
            <SectionLabel>COMMENT PAYER</SectionLabel>
            {plan.payments.map((p) => (
              <PaymentItem key={p.name} {...p} />
            ))}
            <PlanSubscribeLink featured={plan.featured} />
          </div>
        ))}
      </div>

      {/* Pack Diaspora */}
      <div
        style={{
          border: "0.5px solid rgba(55,138,221,0.25)",
          backgroundColor: "rgba(55,138,221,0.03)",
          borderRadius: "14px",
          padding: "18px",
          marginBottom: "28px",
        }}
      >
        <div
          className="landing-diaspora-inner"
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            gap: "24px",
          }}
        >
          {/* Colonne gauche */}
          <div>
            <div
              style={{
                display: "inline-flex",
                backgroundColor: "rgba(255,194,14,0.1)",
                color: "var(--color-or-solaire)",
                border: "1px solid var(--color-or-solaire)",
                fontSize: "10px",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: "6px",
                marginBottom: "10px",
              }}
            >
              🌍 Pour les Guinéens de l&apos;étranger
            </div>
            <div
              style={{
                display: "inline-flex",
                marginLeft: "8px",
                backgroundColor: "rgba(55,138,221,0.12)",
                color: "var(--color-feature-azure)",
                fontSize: "10px",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: "6px",
                marginBottom: "10px",
              }}
            >
              Diaspora
            </div>
            <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-texte-principal)", margin: "0 0 6px" }}>
              Pack Diaspora
            </p>
            <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-vert-energie)", margin: "0 0 10px" }}>
              5 EUR / mois
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.4)",
                maxWidth: "200px",
                lineHeight: 1.5,
                margin: "0 0 14px",
              }}
            >
              Vous vivez à l&apos;étranger et voulez soutenir la musique guinéenne ? Ce pack est fait pour vous.
            </p>
            <Link
              href="/auth/connexion?role=listener"
              style={{
                display: "inline-block",
                backgroundColor: "var(--color-feature-azure)",
                color: "var(--color-noir-profond)",
                fontSize: "13px",
                fontWeight: 600,
                padding: "11px 20px",
                borderRadius: "8px",
                textDecoration: "none",
              }}
            >
              S&apos;abonner Diaspora →
            </Link>
          </div>

          {/* Colonne droite — 2 sous-colonnes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <SectionLabel>CE QUE VOUS AVEZ</SectionLabel>
              {[
                "Tout ce qu'inclut le mensuel",
                "10 votes Awards / jour",
                "Support client prioritaire",
                "Facturé en devise internationale",
              ].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-vert-energie)", lineHeight: "1.5", flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
            <div>
              <SectionLabel>COMMENT PAYER</SectionLabel>
              <PaymentItem
                dot="var(--color-feature-navy)"
                name="Carte bancaire"
                sub="Visa, Mastercard · Sécurisé"
                detail="Facturé en EUR depuis n'importe quel pays"
              />
              <PaymentItem
                dot="var(--color-feature-indigo)"
                name="PayPal / virement"
                sub="Délai 24 à 48h selon la banque"
                detail="Pour ceux sans carte internationale"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
