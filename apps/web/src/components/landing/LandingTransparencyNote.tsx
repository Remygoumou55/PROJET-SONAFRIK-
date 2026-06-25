export function LandingTransparencyNote() {
  return (
    <div className="mx-auto mb-14 flex max-w-[700px] items-start gap-3.5 rounded-[14px] border border-vert-energie/20 bg-vert-energie/5 px-6 py-5">
      <span className="shrink-0 text-xl leading-none text-vert-energie">ℹ</span>
      <div>
        <p className="mb-2 text-sm font-semibold text-texte-principal">
          Comment votre abonnement profite aux artistes
        </p>
        <p className="m-0 text-[13px] leading-relaxed text-white/50">
          <strong className="text-texte-principal">65 %</strong> de chaque abonnement sont
          partagés entre les artistes que vous écoutez, au prorata de leurs écoutes réelles. Les{" "}
          <strong className="text-texte-principal">35 %</strong> restants couvrent
          l&apos;infrastructure et le développement de la plateforme.
        </p>
      </div>
    </div>
  );
}
