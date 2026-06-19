"use client";

interface PlaylistPrivacyToggleProps {
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
}

export function PlaylistPrivacyToggle({ isPublic, onChange }: PlaylistPrivacyToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!isPublic)}
      aria-label={isPublic ? "Rendre la playlist privée" : "Rendre la playlist publique"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        width: "100%",
        backgroundColor: isPublic ? "rgba(255,194,14,0.06)" : "rgba(0,210,106,0.06)",
        border: `1px solid ${isPublic ? "rgba(255,194,14,0.2)" : "rgba(0,210,106,0.2)"}`,
        borderRadius: "10px",
        padding: "12px 14px",
        cursor: "pointer",
        textAlign: "left",
        transition: "background-color 0.2s, border-color 0.2s",
      }}
    >
      {/* Gauche : icône + texte */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "20px", width: "32px", textAlign: "center", flexShrink: 0 }}>
          {isPublic ? "🌍" : "🔒"}
        </span>
        <div>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#ffffff",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {isPublic ? "Playlist publique" : "Playlist privée"}
          </p>
          <p
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.4)",
              margin: "2px 0 0",
              lineHeight: 1.3,
            }}
          >
            {isPublic
              ? "Visible par tous les utilisateurs SONAFRIK"
              : "Visible uniquement par vous"}
          </p>
        </div>
      </div>

      {/* Droite : toggle switch */}
      <div
        style={{
          width: "40px",
          height: "22px",
          borderRadius: "11px",
          backgroundColor: isPublic ? "#00D26A" : "rgba(255,255,255,0.12)",
          position: "relative",
          flexShrink: 0,
          transition: "background-color 0.2s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "3px",
            left: isPublic ? "21px" : "3px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            transition: "left 0.2s",
          }}
        />
      </div>
    </button>
  );
}
