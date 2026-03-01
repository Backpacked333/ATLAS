export function DemoBanner() {
  return (
    <div className="bg-gradient-to-r from-atlas-primary to-blue-700 text-white px-4 py-2 text-center text-xs font-medium">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
        You&apos;re viewing a live demo &mdash; data is simulated. All features are functional.
      </span>
    </div>
  );
}
