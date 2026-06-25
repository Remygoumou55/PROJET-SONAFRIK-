import Link from "next/link";
import { SonafrikLogo } from "./SonafrikLogo";

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
    <footer className="mt-2 border-t border-bordure pt-10">
      <div className="landing-footer-grid mb-8 grid grid-cols-[1.2fr_repeat(3,1fr)] gap-8">
        <div>
          <p className="mb-2">
            <SonafrikLogo size="footer" />
          </p>
          <p className="m-0 text-[13px] leading-relaxed text-texte-secondaire">
            La musique guinéenne mérite sa plateforme.
            <br />
            Notre Bien Commun.
          </p>
        </div>

        {COLUMNS.map(({ title, links }) => (
          <div key={title}>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-texte-secondaire">
              {title}
            </p>
            <ul className="m-0 list-none p-0">
              {links.map(({ label, href }) => (
                <li key={label} className="mb-2">
                  <Link
                    href={href}
                    className="landing-footer-link text-[13px] text-white/55 no-underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="m-0 pb-6 text-center text-xs text-texte-desactive">
        © {new Date().getFullYear()} SONAFRIK — Guinée Conakry. Tous droits réservés.
      </p>
    </footer>
  );
}
