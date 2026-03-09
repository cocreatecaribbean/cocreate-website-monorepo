import facebook_blue from '@/public/fb_blue.svg'
import facebook_yellow from '@/public/fb_yellow.svg'
import facebook_white from '@/public/fb_white.svg'
import instagram_blue from '@/public/ig_blue.svg'
import instagram_yellow from '@/public/ig_yellow.svg'
import instagram_white from '@/public/ig_white.svg'
import linkedin_blue from '@/public/linkedin_blue.svg'
import linkedin_yellow from '@/public/linkedin_yellow.svg'
import linkedin_white from '@/public/linkedin_white.svg'
import youtube_blue from '@/public/yt_blue.svg'
import youtube_yellow from '@/public/yt_yellow.svg'
import youtube_white from '@/public/yt_white.svg'
import Image from 'next/image'
import { Fragment } from 'react'


const ICONPATHS = {
  facebook_blue,
  facebook_yellow,
  facebook_white,
  instagram_blue,
  instagram_yellow,
  instagram_white,
  linkedin_blue,
  linkedin_yellow,
  linkedin_white,
  youtube_blue,
  youtube_yellow,
  youtube_white,
}

const SOCIALURLS = {
    facebook:'https://www.facebook.com/cocreatecaribbean',
    instagram:'https://www.instagram.com/cocreatecaribbean/',
    linkedin: 'https://www.linkedin.com/company/cocreatecaribbean/',
    youtube: 'https://www.youtube.com/@cocreatecaribbean'
}


const COLORS = ['blue','yellow','white'] as const


type Platform = keyof typeof SOCIALURLS
type Color = typeof COLORS[ number ]

type SocialLinksProps = {
    orientation?:'horizontal'|'vertical'
    color:Color
    icon_width?:number
    
}


interface SocialLinks {
    icon_path:string
    icon_url:string
}

type SocialIconsSet = {
    [P in Platform]:SocialLinks
}

type SocialPack = {
    [C in Color]:SocialIconsSet
}


const socialLinks:SocialPack = COLORS.reduce((color_acc, color)=>{
    color_acc[color as Color] = Object.keys(SOCIALURLS).reduce((platform_acc, platform)=>{
        platform_acc[platform as Platform] = {
            icon_path: ICONPATHS[`${platform as keyof typeof SOCIALURLS}_${color}`as keyof typeof ICONPATHS]['src'],
            icon_url: SOCIALURLS[platform as keyof typeof SOCIALURLS]
        }
        return platform_acc
    },{} as SocialIconsSet)

    return color_acc
},{} as SocialPack
)

//console.log(socialLinks)


const SocialLinks = ({orientation='horizontal', color='white', icon_width=50}:SocialLinksProps) => {

    return ( 
        <div className= {` flex ${orientation==='horizontal'?'flex-row':'flex-col'} justify-center gap-4 list-none `}>
            {
                
                
                   Object.keys(socialLinks[color as Color]).map((prop)=>{
                        return <li key={socialLinks[color as Color][prop as Platform].icon_path} className= {`hover:-translate-y-2 hover:transition-transform duration-150 ease-out pointer-events-auto transform-gpu ${color=='yellow'||color=='white'?'hover:bg-[#3b429a]':'hover:bg-[#fab22e]'} hover:rounded-xl`} >
                                    <a href={socialLinks[color as Color][prop as Platform].icon_url} target='_blank'>
                                        <Image src={socialLinks[color as Color][prop as Platform].icon_path} alt={`${prop}_icon`} width={icon_width} height={icon_width}/>
                                    </a>
                                </li>
                    }).flat()
            }
        </div>
     );
}
 
export default SocialLinks;