export default function Loading() {
  return (
    <div className="container-x py-8" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-8 w-60 rounded-xl" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-3xl border border-ink-100 p-3">
            <div className="skeleton aspect-square rounded-2xl" />
            <div className="skeleton mt-4 h-4 w-3/4 rounded" />
            <div className="skeleton mt-2 h-4 w-1/3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
