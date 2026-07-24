import MuxVideoPlayer from '@/components/media/mux-video-player'
import YouTubeEmbed from '@/components/media/youtube-embed'
import type { OriginalVideoMedia } from '@cocreate/types'

type OriginalVideoPlayerProps = {
  media: OriginalVideoMedia
  title?: string
  className?: string
}

export default function OriginalVideoPlayer({
  media,
  title = 'Video',
  className = 'aspect-video w-full overflow-hidden rounded-2xl',
}: OriginalVideoPlayerProps) {
  if (media.mediaSource === 'muxVideo' && media.playbackId) {
    return (
      <div className={className}>
        <MuxVideoPlayer
          playbackId={media.playbackId}
          title={title}
          poster={media.posterUrl}
          className="h-full w-full"
        />
      </div>
    )
  }

  if (media.youtubeVideoId) {
    return <YouTubeEmbed videoId={media.youtubeVideoId} title={title} className={className} />
  }

  return null
}
