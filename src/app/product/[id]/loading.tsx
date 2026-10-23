export default function Loading() {
  return <div role="status" aria-live="polite" className="mx-auto w-full max-w-5xl p-4">
    <p className="py-4 text-sm">Se încarcă produsul…</p>
    <div className="grid gap-6 md:grid-cols-2" aria-hidden="true"><div className="aspect-[3/4] max-h-[65svh] rounded-xl bg-[#eee7de]"/><div className="space-y-5"><div className="h-8 rounded bg-[#eee7de]"/><div className="h-6 w-1/2 rounded bg-[#eee7de]"/><div className="h-12 rounded bg-[#eee7de]"/></div></div>
  </div>;
}
