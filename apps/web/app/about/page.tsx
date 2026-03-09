import * as fonts from '@/styles/fonts'



const About:React.FC = ()=>{
    return (

        <main className="">
            <section className="w-dvw flex justify-center overflow-hidden mb-60">
                <div className="grid grid-cols-1 grid-rows-1">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="z-0 w-dvw aspect-3/2 sm:aspect-3/2 md:aspect-4/1 object-cover col-span-1 row-span-1 col-start-1 row-start-1 col-end-1 row-end-1"
                >
                    <source
                    src="/videos/cocreate-animated-bg-A.webm"
                    type="video/webm"
                    />
                    Your browser does not support transparent video.
                </video>
                
                <h2
                    className={`${fonts.bricolage_grot800.className} z-10 text-white text-[clamp(2rem,5vw,6rem)] col-span-1 row-span-1 col-start-1 row-start-1 col-end-1 row-end-1 justify-self-center self-center text-center leading-none`}
                >
                    About
                </h2>
                </div>
            </section>
            
        
   


            <section  className=" flex flex-col justify-center items-center">
               
            </section>
        </main>
    )
}

export default About