export default function WorkDetailLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-28 rounded-2xl" style={{ backgroundColor: "#1F1F1F" }} />
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-32 rounded-t-lg" style={{ backgroundColor: "#1F1F1F" }} />
        ))}
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="h-20 rounded-xl" style={{ backgroundColor: "#1F1F1F" }} />
      ))}
    </div>
  );
}
