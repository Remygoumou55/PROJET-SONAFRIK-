import type { ReactNode } from "react";

type RoleAccent = "listener" | "artist";

interface RoleSelectionCardProps {
  icon: ReactNode;
  label: string;
  description: string;
  accent: RoleAccent;
  loading: boolean;
  disabled: boolean;
  dimmed: boolean;
  onSelect: () => void;
}

const ACCENT_BORDER: Record<RoleAccent, string> = {
  listener: "border-l-vert-energie",
  artist: "border-l-or-solaire",
};

export function RoleSelectionCard({
  icon,
  label,
  description,
  accent,
  loading,
  disabled,
  dimmed,
  onSelect,
}: RoleSelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-busy={loading}
      className={[
        "group flex w-full items-center gap-4 rounded-xl border border-bordure border-l-4 bg-surface p-5 text-left",
        ACCENT_BORDER[accent],
        "transition-all duration-300 ease-in-out",
        "hover:border-vert-energie hover:bg-elevated hover:shadow-md",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vert-energie",
        "disabled:cursor-not-allowed",
        dimmed ? "opacity-50" : "opacity-100",
      ].join(" ")}
    >
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-bordure bg-elevated transition-colors duration-300 group-hover:border-vert-energie/40 group-hover:bg-vert-energie/10"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-texte-principal">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-texte-secondaire">{description}</p>
      </div>
      {loading ? (
        <span
          className="ml-auto h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-vert-energie border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        <span
          className="ml-auto shrink-0 text-xl font-light text-texte-desactive transition-colors duration-300 group-hover:text-vert-energie"
          aria-hidden="true"
        >
          →
        </span>
      )}
    </button>
  );
}

function HeadphonesIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 14v-2a8 8 0 0 1 16 0v2"
        stroke="var(--color-vert-energie)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <rect
        x="2"
        y="14"
        width="5"
        height="7"
        rx="2"
        stroke="var(--color-vert-energie)"
        strokeWidth="1.75"
      />
      <rect
        x="17"
        y="14"
        width="5"
        height="7"
        rx="2"
        stroke="var(--color-vert-energie)"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function MicrophoneIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="9"
        y="3"
        width="6"
        height="11"
        rx="3"
        stroke="var(--color-or-solaire)"
        strokeWidth="1.75"
      />
      <path
        d="M6 11a6 6 0 0 0 12 0"
        stroke="var(--color-or-solaire)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M12 17v4M9 21h6"
        stroke="var(--color-or-solaire)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const ROLE_ICONS = {
  listener: <HeadphonesIcon />,
  artist: <MicrophoneIcon />,
} as const;
