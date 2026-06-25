type SonafrikLogoSize = "nav" | "footer";

const SIZE_CLASS: Record<SonafrikLogoSize, string> = {
  nav: "text-xl font-semibold tracking-[4px] leading-none",
  footer: "text-lg font-semibold tracking-[3px]",
};

export function SonafrikLogo({ size = "nav" }: { size?: SonafrikLogoSize }) {
  return (
    <span className={SIZE_CLASS[size]}>
      <span className="text-texte-principal">SON</span>
      <span className="text-or-solaire">A</span>
      <span className="text-vert-energie">FRIK</span>
    </span>
  );
}
