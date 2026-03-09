import * as fonts from '@/styles/fonts'



const Contact:React.FC = ()=>{
    return (

        <main className="">
            <section  className=" flex flex-col justify-center items-center">
                <div className={`relative w-fit h-fit pt-90 text-[clamp(3rem,5vw,7rem)] mb-60 ${fonts.bricolage_grot600.className}`}> Contact </div>    
            </section>
        </main>
    )
}

export default Contact