'use client'

import * as fonts from '@/styles/fonts'
import logo from "@/public/co_create_logo_hor_wht.svg";
import Image from 'next/image'
import Link from "next/link";
import SocialLinks from './social-icons';
import ButtonWithRef from './button';
import { getMenuLabel } from '@/site-info/global-site-info';
import dayjs from 'dayjs';
import { FormEvent, useEffect, useState } from 'react';




const Footer:React.FC = ()=>{

    const [year, setYear] = useState<number | null > (null)
    const [email, setEmail] = useState('')
    const [website, setWebsite] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [newsletterMessage, setNewsletterMessage] = useState<string | null>(null)
    const [newsletterError, setNewsletterError] = useState<string | null>(null)

    useEffect(()=>{
        setYear(dayjs().year())
    }, [])

    const onNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setSubmitting(true)
        setNewsletterMessage(null)
        setNewsletterError(null)

        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, website }),
            })
            const data = (await response.json()) as { ok?: boolean; message?: string }

            if (!response.ok || !data.ok) {
                throw new Error(data.message ?? 'Unable to subscribe right now.')
            }

            setNewsletterMessage(
                data.message ??
                    'Thanks! Check your inbox to confirm your subscription.',
            )
            setEmail('')
        } catch (err) {
            setNewsletterError(
                err instanceof Error ? err.message : 'Unable to subscribe right now.',
            )
        } finally {
            setSubmitting(false)
        }
    }




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
                        <form
                            onSubmit={onNewsletterSubmit}
                            className='relative flex flex-col items-center w-fit'
                            noValidate
                            suppressHydrationWarning
                        >
                            <div>
                                <h3 className='text-[0.4em] lg:text-[0.25em] w-fit leading-none mb-4'>Join our mailing list to stay Inspired!</h3>
                            </div>

                            <input
                                suppressHydrationWarning
                                type="text"
                                name="website"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                tabIndex={-1}
                                autoComplete="off"
                                aria-hidden
                                className="pointer-events-none absolute h-0 w-0 opacity-0"
                            />

                            <input
                                suppressHydrationWarning
                                className='w-full h-12 text-white bg-transparent mx-auto border-2 border-casablanca rounded-md text-[16px] md:text-[clamp(0.7rem,0.8vw,2rem)] px-4 mb-4'
                                id='footer-email'
                                name='email'
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder='email'
                                autoComplete='email'
                                disabled={submitting}
                            />
                            <ButtonWithRef
                                type="submit"
                                variant='primary'
                                disabled={submitting}
                                className='bg-casablanca text-chambray py-3 px-8 hover:bg-amber-200 hover:text-blue-900 disabled:opacity-60'
                            >
                                {submitting ? 'Sending…' : 'Subscribe'}
                            </ButtonWithRef>
                            {newsletterMessage ? (
                                <p className='mt-3 max-w-sm text-center text-[clamp(0.45rem,0.55vw,0.9rem)] leading-snug text-casablanca'>
                                    {newsletterMessage}
                                </p>
                            ) : null}
                            {newsletterError ? (
                                <p className='mt-3 max-w-sm text-center text-[clamp(0.45rem,0.55vw,0.9rem)] leading-snug text-red-200'>
                                    {newsletterError}
                                </p>
                            ) : null}
                        </form>
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
                        <li className='hover:text-casablanca transition-colors duration-200'><Link href={'/privacy'}>Privacy Policy</Link></li>
                        <li className='hover:text-casablanca transition-colors duration-200'><Link href={'/privacy#cookies'}>Cookies</Link></li>
                    </ul>
                </section>
            </div>
                        <small className={`text-[clamp(0.8rem,1vw,1rem)] block lg:hidden mx-auto mt-20 w-fit `}>&copy; {year != null ? `${year}` : ''} CoCreate Caribbean Limited.</small>
        </footer>
    )
}

export default Footer