export default function LiveControlLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-4 py-4">
      <div className="h-8 w-64 rounded-lg bg-elevated" />
      <div className="h-24 rounded-2xl bg-elevated" />
      <div className="h-16 rounded-xl bg-elevated" />
      <div className="h-16 rounded-xl bg-elevated" />
      <div className="h-16 rounded-xl bg-elevated" />
    </div>
  );
}
