import { Philosophy } from "@/types/global-types"
import strategic_icon from '@/public/strategic-icon_wht.svg'
import creativity_icon from '@/public/creativity-icon_wht.svg'
import connected_icon from '@/public/connected-icon_wht.svg'
import community_icon from '@/public/community-icon_wht.svg'


export const philosophies:Philosophy[] = [
    {name:'Strategic Focus', bgImage:'/strategic-bg.jpg', info:'Delivering measurable results through tailored strategies.', icon:strategic_icon , position:'bottom'},
    {name:'Creatively Bold', bgImage:'/creativity-bg.jpg', info:'Pioneering innovative solutions for Caribbean brands.', icon:creativity_icon , position:'top'},
    {name:'Globally Connected', bgImage:'/connected-bg.jpg', info:'Bridging the Caribbean with global markets.', icon:connected_icon, position:'bottom'},
    {name:'Community Driven', bgImage:'/community-bg.jpg', info:'Empowering local talent and fostering collaboration.', icon:community_icon, position:'top'},
]