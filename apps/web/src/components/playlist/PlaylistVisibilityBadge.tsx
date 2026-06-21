interface PlaylistVisibilityBadgeProps {
  isPublic: boolean;
}

export function PlaylistVisibilityBadge({ isPublic }: PlaylistVisibilityBadgeProps) {
  if (isPublic) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "10px",
        fontWeight: 600,
        backgroundColor: "rgba(255,255,255,0.06)",
        border: "0.5px solid rgba(255,255,255,0.12)",
        color: "rgba(255,255,255,0.5)",
        padding: "3px 9px",
        borderRadius: "14px",
        flexShrink: 0,
      }}
    >
      🔒 Privée
    </span>
  );
}
