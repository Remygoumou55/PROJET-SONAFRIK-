import type { LandingArtistsSection } from "@sonafrik/types";

interface PlayerMockupProps {
  featuredTrack?: LandingArtistsSection["featuredTrack"];
}

/** Mockup player mobile — visuel statique, aucune logique audio. */
export function PlayerMockup({ featuredTrack }: PlayerMockupProps) {
  const title = featuredTrack?.title ?? "Mouna";
  const artistName = featuredTrack?.artistName ?? "Artiste SONAFRIK";
  const initials = featuredTrack?.initials ?? "SA";

  return (
    <div className="landing-player-mockup mx-auto w-full max-w-[380px] rounded-3xl border border-white/10 bg-[var(--t8-surface-01)] p-6 shadow-[0_40px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,210,106,0.1)]">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[2px] text-[var(--t8-primary-lavender)]">
        En cours de lecture
      </p>

      <div className="mx-auto mb-5 flex aspect-square w-full max-w-[280px] items-center justify-center rounded-2xl bg-gradient-to-br from-vert-energie/35 via-noir-profond to-or-solaire/20">
        <span className="text-5xl font-bold text-[var(--t8-pearl)]/90">{initials}</span>
      </div>

      <h3 className="mb-1 text-center text-[22px] font-bold text-[var(--t8-pearl)]">{title}</h3>
      <p className="mb-5 text-center text-base text-white/60">{artistName}</p>

      <div className="mb-2">
        <div className="landing-player-progress-track h-1 overflow-hidden rounded-sm bg-white/10">
          <div className="landing-player-progress-fill" />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-white/40">
          <span>2:14</span>
          <span>3:42</span>
        </div>
      </div>

      <div className="my-5 flex items-center justify-center gap-6">
        <span className="text-xl text-white/50" aria-hidden="true">
          ⏮
        </span>
        <div
          className="flex size-14 items-center justify-center rounded-full bg-[var(--t8-primary-lavender)] text-[22px] text-[var(--t8-deep-black)]"
          aria-hidden="true"
        >
          ▶
        </div>
        <span className="text-xl text-white/50" aria-hidden="true">
          ⏭
        </span>
      </div>

      <div
        className="mb-4 flex justify-center gap-7 text-lg text-white/40"
        aria-hidden="true"
      >
        <span>♥</span>
        <span>↗</span>
        <span>⬇</span>
      </div>

      <div className="flex justify-end">
        <span className="rounded-lg border border-[var(--t8-primary-lavender)]/25 bg-[var(--t8-primary-lavender)]/15 px-2.5 py-1 text-[11px] text-[var(--t8-primary-lavender)]">
          📶 Économie de données activée
        </span>
      </div>
    </div>
  );
}
