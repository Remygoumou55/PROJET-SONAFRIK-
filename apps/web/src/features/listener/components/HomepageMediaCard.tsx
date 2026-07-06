import Link from "next/link";
import { OVERLAY } from "@/lib/design/overlayTokens";

function MusicNoteIcon({ size = 18, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" fill={color} />
      <circle cx="18" cy="16" r="3" fill={color} />
    </svg>
  );
}

interface MediaCardProps {
  title: string;
  subtitle?: string;
  gradient: { from: string; to: string; bgFrom: string; bgTo: string; border: string; shadow: string; glow: string; ringAlpha: string };
  href?: string;
  badge?: string;
}

export function MediaCard({ title, subtitle, gradient, href = "/search", badge }: MediaCardProps) {
  return (
    <Link href={href} className="flex-shrink-0 w-36 group">
      <div
        className="aspect-square rounded-2xl mb-2.5 flex flex-col justify-between p-3 relative overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${gradient.bgFrom} 0%, ${gradient.bgTo} 100%)`,
          border: `1px solid ${gradient.border}`,
          boxShadow: `0 4px 20px ${gradient.shadow}`,
        }}
      >
        {badge && (
          <div
            className="self-start px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide z-10"
            style={{ background: gradient.from, color: "black" }}
          >
            {badge}
          </div>
        )}
        <div
          className="absolute top-1/2 right-2 -translate-y-1/2 w-16 h-16 rounded-full opacity-10"
          style={{ border: `6px solid ${gradient.from}`, background: `radial-gradient(circle, ${gradient.ringAlpha} 30%, transparent 70%)` }}
        />
        <div
          className="absolute top-1/2 right-2 -translate-y-1/2 w-6 h-6 rounded-full opacity-15"
          style={{ background: gradient.from }}
        />
        <div className="mt-auto z-10">
          <MusicNoteIcon color={gradient.from} />
        </div>
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
          style={{ background: OVERLAY.noir50 }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: gradient.from, boxShadow: `0 0 16px ${gradient.glow}` }}
          >
            <svg width={14} height={14} viewBox="0 0 12 14" fill="black">
              <path d="M0 0L12 7L0 14V0Z" />
            </svg>
          </div>
        </div>
      </div>
      <p className="text-xs font-bold truncate" style={{ color: "var(--color-texte-principal)" }}>{title}</p>
      {subtitle && <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--color-texte-subtil)" }}>{subtitle}</p>}
    </Link>
  );
}
