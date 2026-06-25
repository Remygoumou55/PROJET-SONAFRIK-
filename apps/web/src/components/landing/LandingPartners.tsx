const PARTNERS = [
  {
    name: "Orange Money",
    dot: "var(--color-provider-orange)",
    sub: "Paiement mobile Guinée",
  },
  {
    name: "MTN MoMo",
    dot: "var(--color-provider-mtn)",
    sub: "Paiement mobile Guinée",
  },
  {
    name: "Wave",
    dot: "var(--color-vert-energie)",
    sub: "Bientôt disponible",
  },
] as const;

export function LandingPartners() {
  return (
    <section style={{ marginBottom: "56px", textAlign: "center" }}>
      <p
        style={{
          fontSize: "11px",
          color: "rgba(255,255,255,0.28)",
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          marginBottom: "20px",
        }}
      >
        Paiements & partenaires
      </p>
      <div
        className="landing-partners-row"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "12px",
        }}
      >
        {PARTNERS.map(({ name, dot, sub }) => (
          <div
            key={name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 18px",
              borderRadius: "12px",
              border: "1px solid var(--color-bordure)",
              backgroundColor: "var(--color-surface)",
              minWidth: "160px",
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: dot,
                flexShrink: 0,
              }}
              aria-hidden="true"
            />
            <div style={{ textAlign: "left" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-texte-principal)",
                }}
              >
                {name}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--color-texte-secondaire)" }}>
                {sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
