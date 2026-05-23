import { Service } from "@/types/global-types"

export const menu_names: Array<string> = ['about', 'work', 'originals', 'contact']

const menuLabels: Record<string, string> = {
  contact: 'Ask CoCreate',
}

export function getMenuLabel(slug: string): string {
  return menuLabels[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1)
}

const whatWeDoVideo = (filename: string) =>
  `/videos/what-we-do/${filename}`

export const services:Array<{[key:string]:Service}> = [
     {
        brand_service:{
            title:'Brands / Strategy & Campaigns',
            description: 'We craft tailored strategies and campaigns that deliver measurable results and fulfill user needs.',
            previewVideo: whatWeDoVideo('brand_service.mp4'),
        },
        digital_service:{
            title:'Digital Products',
            description: 'We turn your business needs into digital products — web apps, intranets, and mobile experiences your team and customers will actually love using.',
            previewVideo: whatWeDoVideo('digital_service.webm'),
        },
        production_studio:{
            title:'Production / Studio',
            description:'From TV to digital video, we bring your vision to life with world-class production and behind-the-scenes expertise.',
            previewVideo: whatWeDoVideo('production_studio.mp4'),
        },
        pr_communication:{
            title:'PR & Communications',
            description:'We amplify your message and connect you with your audience through impactful storytelling and media relations.',
            previewVideo: whatWeDoVideo('pr_communication.webm'),
        },
        talent:{
            title:'Talent',
            description:'We manage and represent top talent, ensuring their success and alignment with your brand.',
            previewVideo: whatWeDoVideo('talent.mp4'),
        },
        analytics:{
            title:'Analytics & Insights',
            description:'We use data-driven insights to inform strategies and measure success, keeping you future-ready.',
            previewVideo: whatWeDoVideo('analytics.webm'),
        },
    }
]