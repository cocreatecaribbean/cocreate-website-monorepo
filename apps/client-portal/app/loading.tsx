export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[88rem] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="portal-glass-card h-48 animate-pulse" />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="portal-glass-card h-28 animate-pulse" />
        ))}
      </div>
    </main>
  )
}
