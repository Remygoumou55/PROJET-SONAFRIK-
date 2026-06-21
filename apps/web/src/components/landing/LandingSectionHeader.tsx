interface LandingSectionHeaderProps {
  label: string;
  title: string;
  subtitle?: string;
}

export function LandingSectionHeader({ label, title, subtitle }: LandingSectionHeaderProps) {
  return (
    <div style={{ textAlign: "center", marginBottom: subtitle ? "28px" : "32px" }}>
      <p
        style={{
          fontSize: "11px",
          color: "rgba(255,255,255,0.28)",
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          marginBottom: "10px",
        }}
      >
        {label}
      </p>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: 600,
          color: "var(--color-texte-principal)",
          marginBottom: subtitle ? "10px" : 0,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            fontSize: "14px",
            color: "rgba(255,255,255,0.4)",
            maxWidth: "600px",
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
