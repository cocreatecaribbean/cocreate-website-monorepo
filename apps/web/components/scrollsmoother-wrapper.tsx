'use client'

import gsap from "gsap"
import { ScrollSmoother } from "gsap/ScrollSmoother"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"


gsap.registerPlugin(ScrollSmoother, ScrollTrigger ,useGSAP);

interface ScrollSmoothProps {
    children: React.ReactNode
}

const ScrollSmoothWrapper:React.FC<ScrollSmoothProps> = ({children})=>{

    useGSAP(()=>{
        ScrollSmoother.create({
            wrapper: '#smooth-wrapper',
            content: '#smooth-content',
            smooth:1,
            effects: true,
            smoothTouch: false,
            normalizeScroll: false
        })
    })

    return(
        <div id='smooth-wrapper' className="fixed inset-0 w-full h-full overflow-hidden p-0 m-0 ">
            <div id='smooth-content'>
                {children}
            </div>
        </div>
    )
}

export default ScrollSmoothWrapper