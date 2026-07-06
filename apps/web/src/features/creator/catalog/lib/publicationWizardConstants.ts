export const WIZARD_LANG_OPTIONS = [
  { code: "fr", label: "Français" },
  { code: "en", label: "Anglais" },
  { code: "su", label: "Soussou" },
  { code: "ff", label: "Pular" },
  { code: "ma", label: "Malinké" },
  { code: "wo", label: "Wolof" },
  { code: "ha", label: "Haoussa" },
  { code: "dy", label: "Dioula" },
  { code: "ot", label: "Autres" },
] as const;

export function resolveWizardLanguageLabel(code: string): string {
  return WIZARD_LANG_OPTIONS.find((l) => l.code === code)?.label ?? code;
}
