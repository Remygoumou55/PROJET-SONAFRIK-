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
    <section id="faq" className="mb-14 scroll-mt-[88px]">
      <LandingSectionHeader label="FAQ" title="Questions fréquentes" />

      <div className="landing-faq-list mx-auto flex max-w-[720px] flex-col gap-2">
        {FAQ_ITEMS.map(({ q, a }, index) => (
          <details
            key={q}
            className="landing-faq-item overflow-hidden rounded-xl border border-bordure bg-white/[0.02]"
            open={index === 0}
          >
            <summary className="landing-faq-summary flex cursor-pointer list-none items-center justify-between gap-3 px-[18px] py-4 text-[15px] font-semibold text-texte-principal">
              {q}
            </summary>
            <p className="m-0 px-[18px] pb-4 text-sm leading-relaxed text-texte-secondaire">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
