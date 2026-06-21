export default function ArtistPageLoading() {
  return (
    <div className="animate-pulse">
      {/* Banner */}
      <div className="h-36 w-full rounded-b-2xl" style={{ backgroundColor: "var(--color-card)" }} />
      <div className="px-6 -mt-10 pb-8">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full mb-4" style={{ backgroundColor: "var(--color-elevated)" }} />
        {/* Name + bio */}
        <div className="h-6 w-48 rounded-lg mb-2" style={{ backgroundColor: "var(--color-elevated)" }} />
        <div className="h-4 w-72 rounded-lg mb-6" style={{ backgroundColor: "var(--color-card)" }} />
        {/* Albums */}
        <div className="h-4 w-24 rounded mb-3" style={{ backgroundColor: "var(--color-card)" }} />
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-28 flex-shrink-0">
              <div className="aspect-square rounded-xl mb-2" style={{ backgroundColor: "var(--color-card)" }} />
              <div className="h-3 w-20 rounded" style={{ backgroundColor: "var(--color-card)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
