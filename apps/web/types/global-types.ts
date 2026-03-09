import { StaticImageData } from 'next/image'

export interface Service{
    title: string,
    description: string,
}


export interface Philosophy {
    name:string
    bgImage: string
    info: string
    icon: StaticImageData
    position:'top'|'bottom'
}


export interface ClientLogo {
    alt: string
    src: string
    
}