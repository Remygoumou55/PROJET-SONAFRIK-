/** Lueurs d'ambiance — réutilisées landing + auth (desktop uniquement côté auth). */
export function AmbientBackgroundGlow({ className }: { className?: string }) {
  const base = "pointer-events-none fixed z-0 max-md:hidden";
  const cn = className ? `${base} ${className}` : base;

  return (
    <>
      <div
        className={cn}
        style={{
          top: "-150px",
          left: "-150px",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(0,210,106,0.07) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div
        className={cn}
        style={{
          top: "0",
          right: "-150px",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(255,194,14,0.05) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div
        className={cn}
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "900px",
          height: "500px",
          background:
            "radial-gradient(ellipse, rgba(0,210,106,0.04) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div
        className={cn}
        style={{
          bottom: "0",
          right: "-100px",
          width: "600px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(255,194,14,0.04) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div
        className={cn}
        style={{
          bottom: "100px",
          left: "-100px",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(55,138,221,0.05) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
    </>
  );
}
