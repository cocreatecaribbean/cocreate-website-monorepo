"use client";
import { menu_names, getMenuLabel } from "@/site-info/global-site-info";
import logo from "@/public/co_create_logo_hor_blue.svg";
import Image from "next/image";
import Link from "next/link";
import * as fonts from "@/styles/fonts";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useSearch } from "@/components/search/search-provider";

const NavDesktop: React.FC = () => {
  const pathname = usePathname();
  const { openSearch } = useSearch();

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
        className={`flex flex-row items-center justify-between gap-8 ${fonts.bricolage_grot500.className}`}
      >
        <div className="flex flex-row items-center gap-10">
          {menu_names.map((item, id) => {
            const isActive = pathname === `/${item}`;
            const label = getMenuLabel(item);

            return (
              <li key={id}>
                <Link
                  href={`/${item}`}
                  className={`
                    relative inline-block
                    transition-all duration-300 hover:-translate-y-2
                    before:content-[''] before:absolute before:left-1/2 before:top-0 before:z-0
                    before:h-[2.75rem] before:w-[calc(100%+0.75rem)] before:-translate-x-1/2
                    ${isActive ? "text-sanmarino" : "text-slate-900"}
                    after:pointer-events-none
                    after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:top-[110%]
                    after:rounded-full after:w-3 after:h-3
                    ${isActive ? "after:bg-casablanca" : "after:bg-sanmarino"}
                    after:transition-opacity after:duration-300
                    ${
                      isActive
                        ? "after:opacity-100"
                        : "after:opacity-0 hover:after:opacity-100"
                    }
                  `}
                >
                  <span className="relative z-[1]">{label}</span>
                </Link>
              </li>
            );
          })}
          <button
            type="button"
            aria-label="Open search"
            onClick={openSearch}
            className="relative inline-block cursor-pointer text-slate-900 transition-all duration-300 hover:-translate-y-2 hover:text-sanmarino"
          >
            <span className="relative z-[1] inline-flex translate-y-[3px] items-center">
              <Search className="h-5 w-5" strokeWidth={2.25} />
            </span>
          </button>
        </div>
      </ul>
    </div>
  );
};

export default NavDesktop;
