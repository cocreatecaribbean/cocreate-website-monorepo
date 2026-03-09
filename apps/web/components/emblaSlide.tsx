import * as fonts from '@/styles/fonts'
import {useState, useEffect} from 'react'
import Image from 'next/image'
import { ImageProps } from 'next/image'
import { StaticImageData } from 'next/image'
import { cn } from '@/utils/tailwind-helpers'
import modalBtn from '@/public/open-modal-btn.svg'


interface Props{
    bgImage:string,
    name:string,
    info:string,
    icon:StaticImageData,
    position: 'bottom'|'top',
    isActive: boolean
}

const EmblaSlide = ({ bgImage, name, info, icon, position, isActive }: Props) => {

    const [expanded, setExpanded] = useState<boolean>(false);

    useEffect(() => {
        if (!isActive) {
            setExpanded(false);
        }
    }, [isActive]); // Only run when isActive changes
    
    
    const words = name.split(' ')
    return(
        <div className={cn(isActive===true?`opacity-100`:`opacity-70`,
           `w-full
            h-full
            transition-all
            duration-300
            relative
            rounded-4xl
            text-white
            overflow-hidden
            ${fonts.bricolage_grot600.className}`,
            position==='bottom'?'justify-end':'justify-start')}
            style={{ fontSize: 'clamp(0.75rem, 3.5cqw, 1.25rem)' }}>
            

            <div className={cn(`
                w-full
                h-full
                bg-center
                bg-cover
                text-white
                px-[2em]
                py-[2em]
                flex
                flex-col`,
                position==='bottom'?'justify-end':'justify-start')}
                style={{ backgroundImage: `url(${bgImage})` }}>
                <div className={cn(`w-full h-[50%] flex-1 self-end`, position==='bottom'?' order-1 justify-start':' order-2 justify-end')}></div>
                <div className={cn(`flex-2 flex flex-col `, position==='bottom'?' order-2 justify-end':' order-1 justify-start')}>
                    <Image className='w-[6em] h-[6em]' src={icon} alt={`${name}-icon`}/>
                    <h3 className="text-[2.5em] md:text-[2em] xl:text-[3em] leading-none ">
                        {words[0]}<br/>{words[1]}
                    </h3>
                </div>
            </div>

            {/* info section */}
            <div className={cn(` flex flex-col justify-center bg-[#234199] absolute inset-0 gap-y-8 px-15 transition-opacity duration-200 z-5`, expanded && isActive?'opacity-100 pointer-events-auto':'opacity-0 pointer-events-none')}>
                <h4 className='text-[#fab22e] leading-none text-[1.8em]'>
                    {name}
                </h4>
                <p className='text-white text-[1.5em] '>
                    {info}
                </p>
            </div>

            {/* button */}
            <div className={cn(` absolute z-10 right-0 px-[2em] py-[2em] flex flex-col transition-opacity duration-200 bottom-0 `,isActive===true?`opacity-100 `:` opacity-0 `)}>
                <Image 
                    onClick={(e)=>{
                        e.stopPropagation()
                        setExpanded(prev => !prev)
                    }
                        
                    } 
                    
                    className={cn('opacity-90 transition-all duration-300 w-[4em] h-[4em]', isActive===true?'hover:cursor-pointer':'hover:cursor-default pointer-events-none', expanded?'rotate-45':'rotate-0')} src={modalBtn} alt='modal-button'
                />
            </div>
        </div>
    )
}

export default EmblaSlide