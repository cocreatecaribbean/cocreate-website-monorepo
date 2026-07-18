//'use client'

//import { useEffect, useRef } from "react"

const BackgroundVideo = ({src=''}:{src:string})=>{

    // const video_ref = useRef<HTMLVideoElement>(null)

    // useEffect(() => {
    //     const video = video_ref.current
    //     if (!video) return

    //     video.loop = true
    
       
    //   }, [])

    return(
        <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
            className="h-full w-full max-w-full opacity-100 object-cover pointer-events-none select-none "
        >
            <source type="video/mp4" src={src} />
        </video>
    ) 

}

export default BackgroundVideo
