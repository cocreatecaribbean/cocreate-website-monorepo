'use client'

import * as fonts from '@/styles/fonts'
import logo from "@/public/co_create_logo_hor_wht.svg";
import Image from 'next/image'
import Link from "next/link";
import SocialLinks from './social-icons';
import ButtonWithRef from './button';
import { getMenuLabel } from '@/site-info/global-site-info';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';




const Footer:React.FC = ()=>{

    const [year, setYear] = useState<number | null > (null)

    useEffect(()=>{
        setYear(dayjs().year())
    })




    return(
        <footer className={`bg-chambray text-white text-[clamp(2rem,5vw,6rem)] px-[0.2em] md:px-[1em] pt-[2em] md:pt-[0.8em] pb-[4em] lg:pb-[0.8em] ${fonts.bricolage_grot400.className}`}>

            <div className={`@container flex flex-col md:flex-row gap-20 lg:gap-40 items-center w-full aspect-4/1 `}>
                <section className='w-[80%] md:w-[60%] lg:w-[50%] grid md:grid-rows-2 md:grid-cols-1 gap-y-20 lg:gap-y-0 lg:grid-cols-[1fr_2fr] '>
                    <section className=' flex flex-col w-fit gap-y-6 lg:gap-y-10 place-self-center'>
                        <div>
                            <Link href={'/'}>
                                <Image src={logo} alt='' className='w-[7em] md:w-[5em] lg:w-[2.3em]'/>
                            </Link>
                        </div>
                        <div className='w-fit md:w-[70%] lg:w-fit mx-auto'><SocialLinks color='yellow' icon_width={40}/></div>
                        <small className={`text-[clamp(0.5rem,0.6vw,1rem)] hidden lg:block mx-auto `}>&copy; {`${year}`} CoCreate Caribbean Limited.</small>

                    </section>
                    <section className='justify-self-start lg:justify-self-center mx-auto lg:mx-0'>
                        <div className='flex flex-col items-center w-fit'>
                            <div>
                                <h3 className='text-[0.4em] lg:text-[0.25em] w-fit leading-none mb-4'>Join our mailing list to stay Inspired!</h3>
                            </div>
                        
                            <input suppressHydrationWarning className='w-full h-12 text-white bg-transparent mx-auto border-2 border-casablanca rounded-md text-[16px] md:text-[clamp(0.7rem,0.8vw,2rem)] px-4 mb-4' id='footer-email' name='email' type="email" placeholder='email' autoComplete='email' />
                            <ButtonWithRef variant='primary' className='bg-casablanca text-chambray py-3 px-8 hover:bg-amber-200 hover:text-blue-900'>
                                Subscribe
                            </ButtonWithRef>
                            
                        </div>
                    </section>
                </section>
                <section className='flex flex-col md:flex-row shrink-0 gap-x-0 md:gap-x-10 lg:gap-x-20 gap-y-10 md:gap-y-0 self-center lg:self-start pt-0 lg:pt-[0.3em]'>
                    <ul className={`w-fit flex flex-col text-[clamp(1rem,1.2vw,3rem)] ${fonts.bricolage_grot400.className} text-center md:text-left mx-auto`}>
                        <li className='hover:text-casablanca transition-colors duration-200'><Link href={'/'}>Home</Link></li>
                        <li className='hover:text-casablanca transition-colors duration-200'><Link href={'/about'}>About</Link></li>
                        <li className='hover:text-casablanca transition-colors duration-200'><Link href={'/work'}>Work</Link></li>
                        <li className='hover:text-casablanca transition-colors duration-200'><Link href={'/originals'}>Originals</Link></li>
                        <li className='hover:text-casablanca transition-colors duration-200'><Link href={'/contact'}>{getMenuLabel('contact')}</Link></li>
                    </ul>
                    <ul className={`w-fit flex flex-col text-[clamp(1rem,1.2vw,3rem)] ${fonts.bricolage_grot400.className} text-center md:text-left mx-auto`}>
                        <li className='hover:text-casablanca transition-colors duration-200'><Link href={'/media-updates/press'}>Press</Link></li>
                        <li className='hover:text-casablanca transition-colors duration-200'><Link href={'/media-updates/awards'}>Awards</Link></li>
                    </ul>
                </section>
            </div>
            <small className={`text-[clamp(0.8rem,1vw,1rem)] block lg:hidden mx-auto mt-20 w-fit `}>&copy; {`${year ?? new Date().getFullYear()}`} CoCreate Caribbean Limited.</small>
        </footer>
    )
}

export default Footer