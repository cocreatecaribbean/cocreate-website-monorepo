import { Service } from "@/types/global-types"

export const menu_names:Array<string> = ['about', 'work', 'contact']

export const services:Array<{[key:string]:Service}> = [
     {
        brand_service:{
            title:'Brands / Strategy & Campaigns',
            description: 'We craft tailored strategies and campaigns that deliver measurable results and fulfill user needs.'
        },
        digital_service:{
            title:'Digital Products',
            description: 'We turn your business needs into digital products — web apps, intranets, and mobile experiences your team and customers will actually love using.'
        },
        production_studio:{
            title:'Production / Studio',
            description:'From TV to digital video, we bring your vision to life with world-class production and behind-the-scenes expertise.'
        },
        pr_communication:{
            title:'PR & Communications',
            description:'We amplify your message and connect you with your audience through impactful storytelling and media relations.'
        },
        talent:{
            title:'Talent',
            description:'We manage and represent top talent, ensuring their success and alignment with your brand.'
        },
        analytics:{
            title:'Analytics & Insights',
            description:'We use data-driven insights to inform strategies and measure success, keeping you future-ready.'
        },
    }
]