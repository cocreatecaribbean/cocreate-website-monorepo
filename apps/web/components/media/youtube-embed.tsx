type YouTubeEmbedProps = {
  videoId: string
  title?: string
  className?: string
}

export default function YouTubeEmbed({
  videoId,
  title = 'YouTube video',
  className = 'aspect-video w-full overflow-hidden rounded-2xl',
}: YouTubeEmbedProps) {
  return (
    <div className={className}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  )
}
