"use client";

const PROFILE_SECTIONS = [
  { id: "profile-musical-identity", label: "Identité" },
  { id: "profile-musical-dna", label: "ADN" },
  { id: "profile-story", label: "Histoire" },
  { id: "profile-journey", label: "Parcours" },
  { id: "profile-goals", label: "Objectifs" },
  { id: "profile-activity", label: "Activité" },
  { id: "profile-rewards", label: "Récompenses" },
] as const;

export function ProfileSectionQuickNav() {
  return (
    <nav
      className="identity-profile-quicknav"
      aria-label="Sections du profil musical"
    >
      <p className="identity-profile-quicknav__label">Explorer mon profil</p>
      <ul className="identity-profile-quicknav__list">
        {PROFILE_SECTIONS.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`} className="identity-profile-quicknav__link">
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
