'use client'

import {
    Accordion,
    AccordionHeader,
    AccordionTrigger,
  } from "@base-ui/react/accordion";
import { services } from "@/site-info/global-site-info";
import { Service } from "@/types/global-types";
import * as fonts from "@/styles/fonts";


const AccordionDesktop:React.FC = ()=>{
    return(
        <>
            <Accordion.Root
            className="flex flex-col gap-0 relative w-full"
            data-accordion-root
          >
            {/* Shared sliding background */}
            <div
              className="absolute pointer-events-none transition-all duration-300 ease-out opacity-0 bg-casablanca rounded-3xl"
              style={
                {
                  width: "103%",
                  height: "var(--item-height)",
                  top: "var(--item-offset)",
                  left: "-2%",
                  opacity: "var(--item-opacity)",
                  zIndex: 0,
                } as React.CSSProperties
              }
            />

            {services.map((serviceObj, index) => {
              return Object.entries(serviceObj).map(([key, service]) => (
                <Accordion.Item
                  key={key}
                  className="accordion-item transition-opacity duration-300 hover:cursor-pointer relative z-10 peer hover:opacity-100! peer-hover:opacity-50"
                  data-accordion-item
                  onMouseEnter={(e) => {
                    const item = e.currentTarget;
                    const root = item.closest(
                      "[data-accordion-root]"
                    ) as HTMLElement;
                    const header = item.querySelector(
                      ".group\\/header"
                    ) as HTMLElement;
                    const trigger = item.querySelector(
                      "[data-accordion-trigger]"
                    ) as HTMLElement;
                    if (!root || !header) return;

                    // Dim all other items
                    const allItems = root.querySelectorAll(
                      "[data-accordion-item]"
                    );
                    allItems.forEach((otherItem) => {
                      if (otherItem !== item) {
                        (otherItem as HTMLElement).style.opacity = "0.5";
                      } else {
                        (otherItem as HTMLElement).style.opacity = "1";
                      }
                    });

                    // Make this trigger white
                    if (trigger) {
                      trigger.style.color = "#39419a";
                      header.classList.add("after:bg-transparent");
                      trigger.style.transform = "translate(1rem, 0rem)";
                    }

                    const updatePosition = () => {
                      const headerRect = header.getBoundingClientRect();
                      const rootRect = root.getBoundingClientRect();
                      const headerHeight = header.offsetHeight;
                      const offset = headerRect.top - rootRect.top;

                      root.style.setProperty(
                        "--item-height",
                        `${headerHeight}px`
                      );
                      root.style.setProperty("--item-offset", `${offset}px`);
                      root.style.setProperty("--item-opacity", "1");

                      // Continue animation loop
                      (item as any).__rafId =
                        requestAnimationFrame(updatePosition);
                    };

                    updatePosition();
                  }}
                  onMouseLeave={(e) => {
                    const item = e.currentTarget;
                    const root = item.closest(
                      "[data-accordion-root]"
                    ) as HTMLElement;
                    const header = item.querySelector(
                      ".group\\/header"
                    ) as HTMLElement;
                    const trigger = item.querySelector(
                      "[data-accordion-trigger]"
                    ) as HTMLElement;

                    if ((item as any).__rafId) {
                      cancelAnimationFrame((item as any).__rafId);
                      delete (item as any).__rafId;
                    }

                    // Reset trigger color
                    if (trigger) {
                      trigger.style.color = "";
                      header.classList.remove("after:bg-transparent");
                      trigger.style.transform = "translate(0rem, 0rem)";
                    }

                    // Check if mouse is still over another item
                    const isOverAnotherItem = root?.querySelector(
                      "[data-accordion-item]:hover"
                    );
                    if (!isOverAnotherItem) {
                      root?.style.setProperty("--item-opacity", "0");

                      // Reset all items to full opacity
                      const allItems = root?.querySelectorAll(
                        "[data-accordion-item]"
                      );
                      allItems?.forEach((otherItem) => {
                        (otherItem as HTMLElement).style.opacity = "1";
                      });
                    }
                  }}
                >
                  <Accordion.Header
                    className="group/header 
            relative
            after:content-['']
            after:block
            after:w-[95%]
            after:h-[2px]
            after:bg-casablanca
            group-hover:after:bg-black/50
            hover:after:bg-transparent 
            after:absolute 
            after:top-full
            after:left-0
            rounded-3xl
            w-full
            transition
            duration-300
            hover:cursor-pointer"
                  >
                    <Accordion.Trigger
                      data-accordion-trigger
                      className={`${fonts.bricolage_grot500.className}
              py-8
              relative
              text-white
              text-[clamp(2rem,4vw,4rem)] xl:text-[clamp(2rem,3vw,5rem)] 3xl:text-[clamp(2rem,3vw,5rem)]
              w-full
              h-full
              text-left
              transition
              duration-300
              z-10
              inline-block
              hover:cursor-pointer`}
                    >
                      {service.title}
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel className="grid grid-rows-[0fr] data-open:grid-rows-[1fr] data-starting-style:grid-rows-[0fr] data-ending-style:grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out overflow-hidden">
                    <div className="min-h-0">
                      <div
                        className={`w-[80%] text-3xl xl:text-4xl text-casablanca pl-2 pt-10 pb-24 ${fonts.bricolage_grot400.className}`}
                      >
                        {service.description}
                      </div>
                    </div>
                  </Accordion.Panel>
                </Accordion.Item>
              ));
            })}
          </Accordion.Root>
        </>
    )
}


export default AccordionDesktop
