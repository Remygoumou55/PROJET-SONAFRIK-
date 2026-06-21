import { LandingProgressBar } from "./LandingProgressBar";

interface LandingProgressProps {
  subscriberCount: number;
}

const TARGET = 2000;
const MILESTONES = [
  { threshold: 500, label: "500 ✓ Bêta" },
  { threshold: 1000, label: "1 000" },
  { threshold: 1500, label: "1 500" },
  { threshold: 2000, label: "2 000 🚀" },
] as const;

export function LandingProgress({ subscriberCount }: LandingProgressProps) {
  const pct = Math.min((subscriberCount / TARGET) * 100, 100);
  const remaining = Math.max(TARGET - subscriberCount, 0);
  const pctDisplay = pct.toFixed(1);

  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "0.5px solid rgba(255,255,255,0.1)",
        borderRadius: "14px",
        padding: "24px 28px",
        maxWidth: "520px",
        margin: "36px auto 0",
        textAlign: "left",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "4px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "6px",
            }}
          >
            OBJECTIF DE LANCEMENT
          </div>
          <div style={{ lineHeight: 1 }}>
            <span
              style={{
                fontSize: "28px",
                fontWeight: 600,
                color: "var(--color-texte-principal)",
              }}
            >
              {subscriberCount.toLocaleString("fr-FR")}
            </span>
            <span
              style={{
                fontSize: "16px",
                color: "rgba(255,255,255,0.35)",
                fontWeight: 400,
                marginLeft: "4px",
              }}
            >
              / 2 000 abonnés
            </span>
          </div>
        </div>
        <div
          style={{
            backgroundColor: "rgba(0,210,106,0.12)",
            color: "var(--color-vert-energie)",
            fontSize: "13px",
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: "8px",
            whiteSpace: "nowrap",
          }}
        >
          {pctDisplay} %
        </div>
      </div>

      {/* Barre de progression animée */}
      <LandingProgressBar pct={pct} />

      {/* Message */}
      <p
        style={{
          fontSize: "13px",
          color: "rgba(255,255,255,0.4)",
          margin: "0 0 16px",
        }}
      >
        Plus que{" "}
        <strong style={{ color: "rgba(255,255,255,0.8)" }}>
          {remaining.toLocaleString("fr-FR")}
        </strong>{" "}
        abonnés pour le lancement officiel
      </p>

      {/* Jalons */}
      <div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "4px",
            marginBottom: "6px",
          }}
        >
          {MILESTONES.map(({ threshold }) => {
            const reached = subscriberCount >= threshold;
            return (
              <div
                key={threshold}
                style={{
                  height: "4px",
                  borderRadius: "2px",
                  backgroundColor: reached ? "var(--color-vert-energie)" : "rgba(255,255,255,0.08)",
                }}
              />
            );
          })}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "4px",
          }}
        >
          {MILESTONES.map(({ threshold, label }) => {
            const reached = subscriberCount >= threshold;
            return (
              <div
                key={threshold}
                style={{
                  fontSize: "10px",
                  color: reached ? "var(--color-vert-energie)" : "rgba(255,255,255,0.28)",
                  textAlign: "center",
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
