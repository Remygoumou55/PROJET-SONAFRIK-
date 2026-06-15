export default function RightsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-5 w-40 rounded-lg" style={{ backgroundColor: "#1F1F1F" }} />
          <div className="h-3 w-24 rounded mt-1.5" style={{ backgroundColor: "#1F1F1F" }} />
        </div>
        <div className="h-9 w-32 rounded-xl" style={{ backgroundColor: "#1F1F1F" }} />
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-16 rounded-xl"
          style={{ backgroundColor: "#1F1F1F" }}
        />
      ))}
    </div>
  );
}
