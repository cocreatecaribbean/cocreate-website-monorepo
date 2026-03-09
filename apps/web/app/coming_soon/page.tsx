import Image from "next/image";
import white_logo from "../../public/co_create_logo_hor_wht.svg";
//import { dm_sans, gabarito400, work_sans } from "@/styles/fonts";
import * as fonts from '@/styles/fonts'
import dayjs from "dayjs";
import BackgroundVideo from "@/components/background_video";
import BackgroundPlayer from "next-video/background-player";
import Video from "next-video";
import getStarted from "../../videos/get-started.mp4";
import cocreateReel from "https://cdn.cosmicjs.com/5bfcb200-1511-11f0-91ec-af6adca2ead2-cocreate_2024_reel_looped.mp4";
import SocialLinksComp from "@/components/social-icons";

// /app/coming_soon/page.tsx

async function getData() {
  const res = await fetch(
    `https://api.cosmicjs.com/v3/buckets/cocreate-production/media?pretty=true&skip=0&limit=10&read_key=iOWcAfrdx1P3KiIWVbPguIW6OA8p5ej1v8MKQiY5WPvtWqoxWP&props=url,imgix_url,name`,
    {
      cache: "no-store", // Prevent caching (optional)
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

export default async function ComingSoon() {
  const data = await getData();

  const app_year = dayjs().format("YYYY");

  return (
    <main>
      {/* <div className=' flex flex-row justify-center mt-8 mb-48 '>
                <Image src={logo} alt='cocreate logo'/>
            </div> */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center h-32">
        <div className="z-20 w-fit h-fit">
          <Image src={white_logo} alt="cocreate logo" />
        </div>
      </div>

      <section
        className={` w-full grid grid-cols-1 grid-rows-1 place-items-center relative `}
      >
        <div className=" col-start-1 col-span-1 row-start-1 bg-black w-auto h-auto">
          <BackgroundVideo src='https://cdn.cosmicjs.com/5bfcb200-1511-11f0-91ec-af6adca2ead2-cocreate_2024_reel_looped.mp4' />
        </div>

        <h1
          className={` ${fonts.bricolage_grot400.className} text-center px-10 translate-y-[-5rem] 2xl:translate-y-[-8rem] self-end col-start-1 col-span-1 row-start-1 text-white text-[clamp(0.5rem,calc(1rem+3vw),10rem)] z-[2] `}
        >
          Our website will be ready soon!
        </h1>
      </section>
      <section>
        <p className=" text-left text-[clamp(0.5rem,calc(1rem+3vw),4rem)] leading-[clamp(1rem,calc(1rem+4.5vw),5rem)] pt-24 pb-10 px-16 lg:pt-64 lg:pb-32 sm:px-24 md:px-36 2xl:px-[24rem] tracking-tight ">
          <span className=" text-[#446db5] uppercase font-semibold ">co</span>
          <span className=" text-[#3b429a] uppercase font-semibold ">
            create
          </span>{" "}
          <span className=" font-light">
          Caribbean is a revolution. Reimagining branding and designing
          transformational solutions are at the heart of what we do. We position
          Caribbean brands for unparalleled global success.
            </span>
        </p>
      </section>
      <div className= {` mt-36 mb-24 `}>
        <SocialLinksComp orientation="horizontal" color="blue" />
      </div>
      <div className=" text-center uppercase mb-8 ">
        &copy;cocreate caribbean {app_year}
      </div>
    </main>
  );
}
