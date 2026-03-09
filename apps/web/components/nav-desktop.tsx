"use client";
import { menu_names } from "@/site-info/global-site-info";
import logo from "@/public/co_create_logo_hor_blue.svg";
import Image from "next/image";
import Link from "next/link";
import * as fonts from "@/styles/fonts";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NavDesktop: React.FC = () => {
  const pathname = usePathname();

  return (
    
    <div
      id="desktop-nav"
      className=" fixed top-10 inset-0 py-5 px-10 w-fit h-fit mx-auto bg-white/70 rounded-full backdrop-blur-lg flex flex-row gap-10 justify-center items-center border border-white/20"
    >
      <div>
        <Link href={"/"}>
          <Image className="w-30" src={logo} alt="logo" />
        </Link>
      </div>
      <ul
        className={`flex flex-row justify-between gap-8 ${fonts.bricolage_grot500.className}`}
      >
        <div className=" flex flex-row gap-10 ">
          {menu_names.map((item, id) => {
            const isActive = pathname === `/${item}`;
            const renamed_item = item.charAt(0).toUpperCase() + item.slice(1);

            return (
              <li
                key={id}
                className={`h-fit relative transition-all duration-300 hover:-translate-y-2
                ${isActive ? "text-sanmarino" : "text-slate-900"}
                after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:top-[110%] 
                after:rounded-full after:w-3 after:h-3 after:bg-sanmarino
                after:transition-opacity after:duration-300
                ${
                  isActive
                    ? "after:opacity-100"
                    : "after:opacity-0 hover:after:opacity-100"
                }
            `}
              >
                <Link href={`/${item}`}>{renamed_item}</Link>
              </li>
            );
          })}
        </div>
      </ul>
    </div>
  );
};

export default NavDesktop;
