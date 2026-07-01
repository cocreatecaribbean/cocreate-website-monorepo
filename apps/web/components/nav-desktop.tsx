"use client";
import { menu_names, getMenuLabel, clientPortalNav } from "@/site-info/global-site-info";
import logo from "@/public/co_create_logo_hor_blue.svg";
import Image from "next/image";
import Link from "next/link";
import * as fonts from "@/styles/fonts";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useSearch } from "@/components/search/search-provider";
import { useClientPortalLogin } from "@/components/client-portal/client-portal-provider";

const NavDesktop: React.FC = () => {
  const pathname = usePathname();
  const { openSearch, closeSearch } = useSearch();
  const { isOpen: isClientPortalOpen, openClientPortalLogin, closeClientPortalLogin } =
    useClientPortalLogin();

  return (
    
    <div
      id="desktop-nav"
      className="pointer-events-auto fixed top-10 left-1/2 z-[250] flex h-fit w-fit max-w-[calc(100vw-2.5rem)] -translate-x-1/2 flex-row flex-nowrap items-center justify-center gap-[clamp(1.25rem,3vw,2.5rem)] rounded-full border border-white/20 bg-white/70 px-[clamp(1.25rem,3.5vw,2.5rem)] py-[clamp(0.875rem,1.5vw,1.25rem)] backdrop-blur-lg"
    >
      <div className="shrink-0">
        <Link href={"/"} onClick={closeSearch}>
          <Image
            className="h-auto w-[clamp(5rem,12vw,7.5rem)] shrink-0"
            src={logo}
            alt="logo"
          />
        </Link>
      </div>
      <ul
        className={`flex min-w-0 flex-row flex-nowrap items-center gap-[clamp(1.5rem,3.5vw,2.5rem)] ${fonts.bricolage_grot500.className}`}
      >
        <div className="flex flex-row flex-nowrap items-center gap-[clamp(1.5rem,3.5vw,2.5rem)]">
          {menu_names.map((item, id) => {
            const isActive = !isClientPortalOpen && pathname === `/${item}`;
            const label = getMenuLabel(item);

            return (
              <li key={id}>
                <Link
                  href={`/${item}`}
                  onClick={closeSearch}
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
                  <span className="relative z-[1] whitespace-nowrap">{label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              aria-current={isClientPortalOpen ? "page" : undefined}
              onClick={() => {
                closeSearch()
                if (isClientPortalOpen) closeClientPortalLogin()
                else openClientPortalLogin()
              }}
              className={`
                    relative inline-block cursor-pointer
                    transition-all duration-300 hover:-translate-y-2
                    before:content-[''] before:absolute before:left-1/2 before:top-0 before:z-0
                    before:h-[2.75rem] before:w-[calc(100%+0.75rem)] before:-translate-x-1/2
                    ${isClientPortalOpen ? "text-sanmarino" : "text-slate-900"}
                    after:pointer-events-none
                    after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:top-[110%]
                    after:rounded-full after:w-3 after:h-3
                    ${isClientPortalOpen ? "after:bg-casablanca" : "after:bg-sanmarino"}
                    after:transition-opacity after:duration-300
                    ${
                      isClientPortalOpen
                        ? "after:opacity-100"
                        : "after:opacity-0 hover:after:opacity-100"
                    }
                  `}
            >
              <span className="relative z-[1] whitespace-nowrap">{clientPortalNav.label}</span>
            </button>
          </li>
          <button
            type="button"
            aria-label="Open search"
            onClick={openSearch}
            className="relative inline-block cursor-pointer text-slate-900 transition-all duration-300 hover:-translate-y-2 hover:text-sanmarino"
          >
            <span className="relative z-[1] inline-flex shrink-0 translate-y-[3px] items-center whitespace-nowrap">
              <Search className="h-5 w-5" strokeWidth={2.25} />
            </span>
          </button>
        </div>
      </ul>
    </div>
  );
};

export default NavDesktop;
