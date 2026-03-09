"use client";
import { menu_names } from "@/site-info/global-site-info";
import logo from "@/public/co_create_logo_hor_blue.svg";
import Image from "next/image";
import Link from "next/link";
import * as fonts from "@/styles/fonts";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const NavMobile: React.FC = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleNavClick = (menu: string) => {
        setIsOpen(false);
        setTimeout(() => {
            router.push(`/${menu}`);
        }, 500);
    };

    useEffect(() => {
        document.documentElement.style.overflow = isOpen ? "hidden" : "";
        document.body.classList.toggle("menu-open", isOpen);
    }, [isOpen]);

    return (
        <div className="fixed inset-0 w-svw sm:w-[70svw] h-full rounded-4xl px-5 pt-5 mx-auto grid grid-rows-1 grid-cols-1 pointer-events-none">
            <div className={`pointer-events-auto w-full bg-chambray/70 backdrop-blur-lg transition-all duration-500 col-start-1 row-start-1 col-span-1 row-span-1 ${isOpen ? 'opacity-100 h-[80svh] rounded-t-[3rem] sm:rounded-t-[3.8rem] rounded-b-4xl' : 'opacity-0 h-[10svh] rounded-t-[5rem] rounded-b-[5rem]'}`}>
                <ul className={`flex w-fit h-full mx-auto flex-col pt-40 text-[clamp(3rem,5vw,6rem)] ${fonts.bricolage_grot600.className} transition-opacity duration-500 ${isOpen ? 'opacity-100 pointer-events-auto delay-300' : 'opacity-0 pointer-events-none delay-0'}`}>
                    {menu_names.map((menu, index) => (
                        <li key={index} className="uppercase">
                            <button className="uppercase text-white" onClick={() => handleNavClick(menu)}>{menu}</button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="pointer-events-auto w-full h-[10%] bg-white/70 backdrop-blur-lg flex flex-row justify-between items-center pl-4 pr-6 rounded-full col-start-1 row-start-1 col-span-1 row-span-1">
                <div className="w-40 h-auto">
                    <Link onClick={(() => isOpen ? setIsOpen(false) : isOpen)} href="/"><Image src={logo} alt="Logo" /></Link>
                </div>
                <div onClick={() => setIsOpen(!isOpen)} className={`w-5 h-5 ${isOpen ? 'bg-chambray' : 'bg-sanmarino'} transition-colors duration-300 rounded-full cursor-pointer`} />
            </div>
        </div>
    );
};

export default NavMobile;