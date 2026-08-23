export function LandingTransparencyNote() {
  return (
    <div className="mx-auto mb-14 flex max-w-[700px] items-start gap-3.5 rounded-[14px] border border-[var(--t8-primary-lavender)]/20 bg-[var(--t8-primary-lavender)]/5 px-6 py-5">
      <span className="shrink-0 text-xl leading-none text-[var(--t8-primary-lavender)]">ℹ</span>
      <div>
        <p className="mb-2 text-sm font-semibold text-[var(--t8-pearl)]">
          Comment votre abonnement profite aux artistes
        </p>
        <p className="m-0 text-[13px] leading-relaxed text-white/50">
          <strong className="text-[var(--t8-pearl)]">65 %</strong> de chaque abonnement sont
          partagés entre les artistes que vous écoutez, au prorata de leurs écoutes réelles. Les{" "}
          <strong className="text-[var(--t8-pearl)]">35 %</strong> restants couvrent
          l&apos;infrastructure et le développement de la plateforme.
        </p>
      </div>
    </div>
  );
}
