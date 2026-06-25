import { LandingProgressBar } from "./LandingProgressBar";

interface LandingProgressProps {
  subscriberCount: number;
  subscriberTarget: number;
}

function buildMilestones(target: number) {
  const steps = [
    Math.round(target * 0.25),
    Math.round(target * 0.5),
    Math.round(target * 0.75),
    target,
  ];
  return steps.map((threshold, i) => ({
    threshold,
    label:
      i === 0
        ? `${steps[0]!.toLocaleString("fr-FR")} ✓ Bêta`
        : i === 3
          ? `${target.toLocaleString("fr-FR")} 🚀`
          : steps[i]!.toLocaleString("fr-FR"),
  }));
}

export function LandingProgress({ subscriberCount, subscriberTarget }: LandingProgressProps) {
  const pct = Math.min((subscriberCount / subscriberTarget) * 100, 100);
  const remaining = Math.max(subscriberTarget - subscriberCount, 0);
  const pctDisplay = Math.round(pct);
  const milestones = buildMilestones(subscriberTarget);

  return (
    <div className="mx-auto mt-9 max-w-[520px] rounded-[14px] border border-white/10 bg-white/5 px-7 py-6 text-left">
      <div className="mb-1 flex items-start justify-between">
        <div>
          <div className="mb-1.5 text-[11px] uppercase tracking-wide text-white/30">
            OBJECTIF DE LANCEMENT
          </div>
          <div className="leading-none">
            <span className="text-[28px] font-semibold text-texte-principal">
              {subscriberCount.toLocaleString("fr-FR")}
            </span>
            <span className="ml-1 text-base font-normal text-white/35">
              / {subscriberTarget.toLocaleString("fr-FR")} abonnés
            </span>
          </div>
        </div>
        <div className="whitespace-nowrap rounded-lg bg-vert-energie/15 px-2.5 py-1 text-[13px] font-semibold text-vert-energie">
          {pctDisplay} %
        </div>
      </div>

      <LandingProgressBar pct={pct} />

      <p className="mb-4 text-[13px] text-white/40">
        Plus que <strong className="text-white/80">{remaining.toLocaleString("fr-FR")}</strong>{" "}
        personnes pour le lancement officiel
      </p>

      <div>
        <div className="mb-1.5 grid grid-cols-4 gap-1">
          {milestones.map(({ threshold }) => {
            const reached = subscriberCount >= threshold;
            return (
              <div
                key={threshold}
                className={`h-1 rounded-sm ${reached ? "bg-vert-energie" : "bg-white/10"}`}
              />
            );
          })}
        </div>
        <div className="grid grid-cols-4 gap-1">
          {milestones.map(({ threshold, label }) => {
            const reached = subscriberCount >= threshold;
            return (
              <div
                key={threshold}
                className={`text-center text-[10px] ${reached ? "text-vert-energie" : "text-white/30"}`}
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
