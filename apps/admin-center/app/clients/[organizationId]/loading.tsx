export default function Loading() {
  return (
    <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-chambray/8 px-4 py-4 sm:px-6 lg:px-8">
        <div className="h-4 w-24 animate-pulse rounded bg-chambray/10" />
        <div className="mt-3 h-8 w-48 animate-pulse rounded bg-chambray/10" />
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-8 w-24 animate-pulse rounded-xl bg-chambray/8" />
          ))}
        </div>
      </div>
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="admin-glass-card h-40 animate-pulse" />
      </div>
    </main>
  )
}
