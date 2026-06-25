/** Logo SONAFRIK aligné sur la landing — SON + A or + FRIK vert */
export function AuthBrandLogo({ className = "mb-4" }: { className?: string }) {
  return (
    <div className={className}>
      <p
        className="font-semibold leading-none"
        style={{ fontSize: "22px", letterSpacing: "4px" }}
      >
        <span style={{ color: "var(--color-texte-principal)" }}>SON</span>
        <span style={{ color: "var(--color-or-solaire)" }}>A</span>
        <span style={{ color: "var(--color-vert-energie)" }}>FRIK</span>
      </p>
      <p
        className="mt-1 font-semibold uppercase"
        style={{
          fontSize: "10px",
          color: "var(--color-or-solaire)",
          letterSpacing: "2.5px",
        }}
      >
        Notre Bien Commun
      </p>
    </div>
  );
}
