'use client'

import * as fonts from "@/styles/fonts";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const About: React.FC = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const videoRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLElement>(null);

    useGSAP(() => {
        // 1. Reveal the section immediately to prevent the FOUC (Flash of Unstyled Content)
        gsap.set(sectionRef.current, { autoAlpha: 1 });

        const el = videoRef.current!;
        const containerEl = sectionRef.current!;

        // 2. Logic for scaling/offsetting based on your existing layout
        const videoRect = el.getBoundingClientRect();
        const containerRect = containerEl.getBoundingClientRect();
        
        const scale = containerRect.width / videoRect.width;
        const videoCenter = videoRect.left + videoRect.width / 2;
        const containerCenter = containerRect.left + containerRect.width / 2;
        const xOffset = containerCenter - videoCenter;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 20%',
                end: '+=1000',
                scrub: true,
                pin: true,
                invalidateOnRefresh: true, // Recalculates if window is resized
            }
        });

        tl.from(el, {
            scale: scale,
            x: xOffset,
            transformOrigin: 'top center',
            ease: 'power3.inOut',
            duration: 1,
        })
        .from('.about-hero-text', {
            opacity: 0,
            ease: 'power2.inOut',
            duration: 1,
        }, '<');

        tl.to({}, { duration: 0.5 });

    }, { scope: mainRef });

    return (
        <main ref={mainRef}>
            {/* Header Section */}
            <section className="w-[80svw] flex flex-col text-black mx-auto mb-30">
                <h1
                    className={`
                        leading-none uppercase w-fit
                        mx-auto pt-60 landscape:pt-20 landscape:lg:pt-48 landscape:xl:pt-72 overflow-hidden
                        col-span-1 col-start-1 row-span-1 row-start-1 text-center bg-clip-text
                        bg-linear-to-r from-sanmarino via-sanmarino to-casablanca text-transparent
                    `}
                >
                    <span className={`text-[clamp(3rem,5vw,7rem)] md:text-[clamp(4rem,5vw,7rem)] ${fonts.bricolage_grot800.className}`}>About</span> <br />
                    <span className={`text-[clamp(2rem,4vw,6rem)] md:text-[clamp(3rem,4vw,6rem)] ${fonts.alkatra400.className}`}>CoCreate</span>
                </h1>
            </section>

            {/* Main Content Section */}
            <section
                ref={sectionRef}
                style={{ visibility: 'hidden' }} // Prevents initial flash before GSAP kicks in
                className="w-[90svw] 2xl:w-[85svw] mx-auto grid grid-cols-[1.5fr_1fr] items-center mb-48"
            >
                <div
                    ref={videoRef}
                    className="z-10 w-full min-h-[50svh] max-h-[55svh] relative rounded-4xl 2xl:rounded-[4rem] overflow-hidden"
                >
                    <Image
                        src='/about-us-test-img.jpg'
                        alt="about image"
                        fill
                        priority // Essential for images used in GSAP pins/heros
                        style={{ objectFit: 'cover' }}
                        className="w-full h-auto"
                    />
                </div>

                <div className="about-hero-text pl-24 pr-10">
                    <h2 className={`philosophy-header h-fit leading-none text-center lg:text-left text-[clamp(2rem,3vw,4rem)] ${fonts.bricolage_grot500.className} mb-6`}>
                        Empowering Brands
                    </h2>
                    <p className={`${fonts.bricolage_grot400.className} text-[clamp(1rem,1vw,1.5rem)]`}>
                        COCREATE Caribbean bridges the gap between Caribbean brands and their audiences through strategic storytelling, innovative design, and immersive digital experiences. From motion graphics that simplify complex ideas to web platforms that foster real engagement, we blend technical expertise with a deep understanding of the market to help businesses shine in their industries.
                    </p>
                </div>
            </section>
        </main>
    );
};

export default About;