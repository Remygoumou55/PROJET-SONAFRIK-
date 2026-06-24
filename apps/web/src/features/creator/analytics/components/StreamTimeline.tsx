import type { StreamTimelineEntry } from "@sonafrik/types";
import { Card, CardContent, CardHeader, CardTitle } from "@sonafrik/ui";

export function StreamTimeline({ entries }: { entries: StreamTimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Évolution des streams (30 jours)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-texte-desactive text-sm">Aucune donnée disponible.</p>
        </CardContent>
      </Card>
    );
  }

  const maxStreams = Math.max(...entries.map((e) => e.streams), 1);

  // Display every 5th label to avoid crowding
  const showLabel = (i: number) =>
    i === 0 || i === entries.length - 1 || i % Math.ceil(entries.length / 6) === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Évolution des streams (30 jours)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-32 items-end gap-px">
          {entries.map((entry, _i) => {
            const totalH = Math.round((entry.streams / maxStreams) * 100);
            const validH = Math.round((entry.valid_streams / maxStreams) * 100);
            return (
              <div key={entry.date} className="group relative flex flex-1 flex-col items-center gap-0.5">
                {/* Tooltip */}
                <div className="bg-elevated border-bordure pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-max -translate-x-1/2 rounded border px-2 py-1 text-xs group-hover:block">
                  <span className="text-texte-secondaire">{entry.date}</span>
                  <br />
                  <span className="text-texte-principal font-medium">{entry.streams} streams</span>
                  <br />
                  <span className="text-vert-energie">{entry.valid_streams} validés</span>
                </div>
                {/* Bar (total) */}
                <div className="relative w-full">
                  <div
                    className="bg-surface w-full rounded-t-sm"
                    style={{ height: `${totalH}%`, minHeight: totalH > 0 ? "2px" : "0" }}
                  />
                  {/* Valid overlay */}
                  <div
                    className="bg-vert-energie absolute bottom-0 left-0 w-full rounded-t-sm opacity-70"
                    style={{ height: `${validH}%`, minHeight: validH > 0 ? "2px" : "0" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {/* X-axis labels */}
        <div className="mt-1 flex">
          {entries.map((entry, i) => (
            <div key={entry.date} className="flex-1 text-center">
              {showLabel(i) && (
                <span className="text-texte-desactive text-[10px]">
                  {entry.date.slice(5)}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="bg-surface h-2.5 w-2.5 rounded-sm" />
            <span className="text-texte-desactive text-xs">Total</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="bg-vert-energie h-2.5 w-2.5 rounded-sm opacity-70" />
            <span className="text-texte-desactive text-xs">Validés</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
