import fs from 'fs'
import path from 'path'
import { ClientLogo } from '@/types/global-types'
import LogoTicker from './logoTicker'


const LogoTickerWrapper:React.FC = ()=>{

   const logoDir = path.join(process.cwd(), 'public/client-logos')
   const getLogoFiles = fs.readdirSync(logoDir)

  const logos = getLogoFiles.reduce((accum, file)=>{
    if (!/\.(png|jpe?g|svg|webp)$/i.test(file)) {
        return accum;
      }
    
      // 2. The Map logic: Transform and add to the "accumulator"
      accum.push({
        src: `/client-logos/${file}`,
        alt: file.split('.')[0].replace(/-/g, ' '),
      });
      return accum as ClientLogo[]
   },[] as ClientLogo[])

//    console.log(getLogoFiles)




    return(
        <>
            <LogoTicker logos={logos}  />
        </>
    )
}

export default LogoTickerWrapper