import { StaticImageData } from 'next/image'

export interface Service{
    title: string,
    /** One string per paragraph — rendered with spacing in What we do accordions */
    description: string[],
    previewVideo: string,
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