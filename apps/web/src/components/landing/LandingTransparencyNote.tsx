export function LandingTransparencyNote() {
  return (
    <div
      style={{
        backgroundColor: "rgba(0,210,106,0.05)",
        border: "0.5px solid rgba(0,210,106,0.16)",
        borderRadius: "14px",
        padding: "20px 24px",
        maxWidth: "700px",
        margin: "0 auto 56px",
        display: "flex",
        gap: "14px",
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: "20px", color: "var(--color-vert-energie)", flexShrink: 0, lineHeight: 1 }}>ℹ</span>
      <div>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-texte-principal)", margin: "0 0 8px" }}>
          Comment votre abonnement profite aux artistes
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "rgba(255,255,255,0.48)",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          Sur chaque abonnement, <strong style={{ color: "var(--color-texte-principal)" }}>65 %</strong> sont partagés
          entre tous les artistes que vous écoutez, au prorata de leurs écoutes.
          <br />
          Si vous passez votre mois à écouter un seul artiste, il reçoit la totalité de ces{" "}
          <strong style={{ color: "var(--color-texte-principal)" }}>65 %</strong>.
          <br />
          Si vous en écoutez dix, chacun reçoit sa part.
          <br />
          Les 35 % restants couvrent les coûts techniques et le développement de la plateforme.
        </p>
      </div>
    </div>
  );
}
