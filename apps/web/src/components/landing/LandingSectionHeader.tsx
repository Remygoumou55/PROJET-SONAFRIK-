interface LandingSectionHeaderProps {
  label: string;
  title: string;
  subtitle?: string;
}

export function LandingSectionHeader({ label, title, subtitle }: LandingSectionHeaderProps) {
  return (
    <div className={`text-center ${subtitle ? "mb-7" : "mb-8"}`}>
      <p className="mb-2.5 text-[11px] uppercase tracking-[1.5px] text-white/30">{label}</p>
      <h2 className="text-2xl font-semibold text-[var(--t8-pearl)]">{title}</h2>
      {subtitle ? (
        <p className="mx-auto mt-2.5 max-w-[600px] text-sm leading-relaxed text-white/40">{subtitle}</p>
      ) : null}
    </div>
  );
}
