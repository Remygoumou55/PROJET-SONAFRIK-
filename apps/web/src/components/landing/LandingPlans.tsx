import Link from "next/link";
import { LandingSectionHeader } from "./LandingSectionHeader";

type Feature = { ok: boolean; text: string };
type Payment = { dotClass: string; name: string; sub: string; detail: string };

interface Plan {
  badgeClass: string;
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

const PAYMENT_ORANGE: Payment = {
  dotClass: "bg-provider-orange",
  name: "Orange Money",
  sub: "Instantané · Partout en Guinée",
  detail: "Depuis votre téléphone",
};

const PAYMENT_MTN: Payment = {
  dotClass: "bg-provider-mtn",
  name: "MTN Mobile Money",
  sub: "Instantané · Partout en Guinée",
  detail: "Depuis votre téléphone",
};

const PAYMENT_ORANGE_ANNUAL: Payment = {
  dotClass: "bg-provider-orange",
  name: "Orange",
  sub: "Unique ou en 2 fois · Instantané",
  detail: "Paiement fractionné disponible",
};

const PAYMENT_MTN_ANNUAL: Payment = {
  dotClass: "bg-provider-mtn",
  name: "MTN",
  sub: "Unique ou en 2 fois · Instantané",
  detail: "Paiement fractionné disponible",
};

const PAYMENT_CARD: Payment = {
  dotClass: "bg-feature-navy",
  name: "Carte bancaire",
  sub: "Visa, Mastercard · Sécurisé",
  detail: "Pour membres hors Guinée",
};

const PLANS: Plan[] = [
  {
    badgeClass: "bg-white/10 text-white/50",
    badgeText: "Journalier",
    title: "Journalier",
    price: "5 000 GNF",
    period: "/ jour",
    tagline: "Accès complet pour une journée.",
    features: [
      { ok: true, text: "Écoute illimitée + hors ligne" },
      { ok: true, text: "Réactions illimitées" },
      { ok: true, text: "1 vote Awards" },
      { ok: false, text: "Cloud personnel" },
    ],
    payments: [PAYMENT_ORANGE, PAYMENT_MTN],
  },
  {
    badgeClass: "bg-white/10 text-white/50",
    badgeText: "Hebdomadaire",
    title: "Hebdomadaire",
    price: "25 000 GNF",
    period: "/ semaine",
    saving: "−5 000 GNF vs journalier",
    tagline: "Une semaine entière, sans interruption.",
    features: [
      { ok: true, text: "Écoute illimitée + hors ligne" },
      { ok: true, text: "Réactions illimitées" },
      { ok: true, text: "3 votes Awards / jour" },
      { ok: true, text: "Cloud personnel 2 GB" },
    ],
    payments: [PAYMENT_ORANGE, PAYMENT_MTN],
  },
  {
    badgeClass: "bg-vert-energie/15 text-vert-energie",
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
    badgeClass: "bg-or-solaire/15 text-or-solaire",
    badgeText: "Meilleure valeur",
    title: "Annuel",
    price: "700 000 GNF",
    period: "/ an",
    saving: "2 mois offerts vs mensuel",
    tagline: "Engagez-vous un an, économisez deux mois.",
    features: [
      { ok: true, text: "Tout ce qu'inclut le mensuel" },
      { ok: true, text: "Cloud personnel 10 GB" },
      { ok: true, text: 'Badge "Fidèle SONAFRIK"' },
      { ok: true, text: "Accès prioritaire nouveautés" },
    ],
    payments: [PAYMENT_ORANGE_ANNUAL, PAYMENT_MTN_ANNUAL, PAYMENT_CARD],
  },
];

function PaymentItem({ dotClass, name, sub, detail }: Payment) {
  return (
    <div className="mb-1.5 rounded-lg bg-white/5 px-2.5 py-2">
      <div className="mb-0.5 flex items-center gap-1.5">
        <span className={`size-2 shrink-0 rounded-full ${dotClass}`} />
        <span className="text-xs font-semibold text-texte-principal">{name}</span>
      </div>
      <p className="m-0 mb-px ml-3.5 text-[10px] text-white/40">{sub}</p>
      <p className="m-0 ml-3.5 text-[10px] text-white/30">{detail}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[9px] uppercase tracking-wide text-white/30">{children}</p>
  );
}

function PlanSubscribeLink({ featured = false }: { featured?: boolean }) {
  return (
    <Link
      href="/auth/connexion?role=listener"
      className={`mt-3.5 block rounded-lg px-4 py-2.5 text-center text-[13px] font-semibold no-underline ${
        featured
          ? "bg-vert-energie text-noir-profond"
          : "border border-white/20 text-texte-principal"
      }`}
    >
      S&apos;abonner →
    </Link>
  );
}

export function LandingPlans() {
  return (
    <section id="tarifs" className="mb-7 scroll-mt-[88px]">
      <LandingSectionHeader label="ABONNEMENTS" title="Choisissez votre formule" />

      <div className="landing-plans-grid mb-3.5 grid grid-cols-4 gap-3.5">
        {PLANS.map((plan) => (
          <div
            key={plan.title}
            className={`flex flex-col rounded-[14px] p-[18px] ${
              plan.featured
                ? "border-[1.5px] border-vert-energie bg-vert-energie/5"
                : "border border-white/10 bg-white/[0.03]"
            }`}
          >
            <div
              className={`mb-2.5 inline-flex self-start rounded-md px-2 py-0.5 text-[10px] font-semibold ${plan.badgeClass}`}
            >
              {plan.badgeText}
            </div>

            <p className="mb-1 text-[15px] font-semibold text-texte-principal">{plan.title}</p>
            <p className="mb-0.5 text-xl font-bold text-texte-principal">
              {plan.price}{" "}
              <span className="text-[13px] font-normal text-white/40">{plan.period}</span>
            </p>
            {plan.saving ? (
              <p className="mb-2 text-[11px] text-vert-energie">{plan.saving}</p>
            ) : null}
            <p className="mb-3 text-xs leading-snug text-white/40">{plan.tagline}</p>

            <hr className="mb-2.5 border-0 border-t border-white/[0.06]" />

            <SectionLabel>CE QUE VOUS AVEZ</SectionLabel>
            <ul className="mb-3 flex-grow list-none p-0">
              {plan.features.map((f) => (
                <li key={f.text} className="mb-1.5 flex items-start gap-1.5">
                  <span
                    className={`shrink-0 text-xs font-bold leading-normal ${
                      f.ok ? "text-vert-energie" : "text-white/20"
                    }`}
                  >
                    {f.ok ? "✓" : "✗"}
                  </span>
                  <span
                    className={`text-xs leading-snug ${f.ok ? "text-white/70" : "text-white/30"}`}
                  >
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>

            <hr className="mb-2.5 border-0 border-t border-white/[0.06]" />

            <SectionLabel>COMMENT PAYER</SectionLabel>
            {plan.payments.map((p) => (
              <PaymentItem key={p.name} {...p} />
            ))}
            <PlanSubscribeLink featured={plan.featured} />
          </div>
        ))}
      </div>

      <div className="mb-7 rounded-[14px] border border-feature-azure/25 bg-feature-azure/5 p-[18px]">
        <div className="landing-diaspora-inner grid grid-cols-[220px_1fr] gap-6">
          <div>
            <div className="mb-2.5 inline-flex rounded-md border border-or-solaire bg-or-solaire/10 px-2.5 py-1 text-[10px] font-semibold text-or-solaire">
              🌍 Pour les Guinéens de l&apos;étranger
            </div>
            <div className="mb-2.5 ml-2 inline-flex rounded-md bg-feature-azure/15 px-2 py-0.5 text-[10px] font-semibold text-feature-azure">
              Diaspora
            </div>
            <p className="mb-1.5 text-base font-semibold text-texte-principal">Pack Diaspora</p>
            <p className="mb-2.5 text-xl font-bold text-vert-energie">5 EUR / mois</p>
            <p className="mb-3.5 max-w-[200px] text-xs leading-snug text-white/40">
              Vous vivez à l&apos;étranger et voulez soutenir la musique guinéenne ? Ce pack est fait pour vous.
            </p>
            <Link
              href="/auth/connexion?role=listener"
              className="inline-block rounded-lg bg-feature-azure px-5 py-2.5 text-[13px] font-semibold text-noir-profond no-underline"
            >
              S&apos;abonner Diaspora →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <SectionLabel>CE QUE VOUS AVEZ</SectionLabel>
              {[
                "Tout ce qu'inclut le mensuel",
                "10 votes Awards / jour",
                "Support client prioritaire",
                "Facturé en devise internationale",
              ].map((f) => (
                <div key={f} className="mb-1.5 flex items-start gap-1.5">
                  <span className="shrink-0 text-xs font-bold leading-normal text-vert-energie">✓</span>
                  <span className="text-xs leading-snug text-white/70">{f}</span>
                </div>
              ))}
            </div>
            <div>
              <SectionLabel>COMMENT PAYER</SectionLabel>
              <PaymentItem
                dotClass="bg-feature-navy"
                name="Carte bancaire"
                sub="Visa, Mastercard · Sécurisé"
                detail="Facturé en EUR depuis n'importe quel pays"
              />
              <PaymentItem
                dotClass="bg-feature-indigo"
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
