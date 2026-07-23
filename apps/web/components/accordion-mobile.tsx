'use client'

import { Accordion } from "@base-ui/react/accordion";
import { services } from "@/site-info/global-site-info";
import * as fonts from "@/styles/fonts";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const AccordionItem = ({ value, service, isFirst }: { value: string; service: any; isFirst: boolean }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!rootRef.current || !panelRef.current) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-open") {
          const isOpen = rootRef.current?.hasAttribute("data-open");
          
          const tl = gsap.timeline({ overwrite: true });

          // Animate the Panel Height and Opacity
          tl.to(panelRef.current, {
            height: isOpen ? "auto" : 0,
            opacity: isOpen ? 1 : 0,
            duration: 0.5,
            ease: "expo.out",
          }, 0);

          // Animate the Line Above (the 'border')
          if (lineRef.current) {
            tl.to(lineRef.current, {
              opacity: isOpen ? 0 : 1,
              duration: 0.4,
              ease: "power2.out",
            }, 0);
          }
        }
      });
    });

    observer.observe(rootRef.current, { attributes: true });
    return () => observer.disconnect();
  }, { scope: rootRef });

  return (
    <Accordion.Item
      ref={rootRef}
      value={value}
      className="accordion-item group relative overflow-hidden"
    >
      {/* This div acts as your top border. 
        We don't show it for the first item to avoid a double line at the top.
      */}
      {!isFirst && (
        <div 
          ref={lineRef}
          className="w-[80%] h-[2px] mx-auto bg-casablanca/50 "
        />
      )}

      <Accordion.Header className="w-full ">
        <Accordion.Trigger
          className={`${fonts.bricolage_grot600.className} mx-auto  py-8 px-4 leading-none text-[clamp(2rem,4vw,4rem)] lg:text-[clamp(2rem,6vw,4rem)] rounded-2xl w-[95%] text-left flex items-center justify-between transition-colors duration-500 group-data-open:bg-casablanca active:bg-black/10`}
        >
          <span className="text-gradient-white-casablanca group-data-open:bg-none group-data-open:text-chambray group-data-open:[-webkit-text-fill-color:var(--color-chambray)]">
            {service.title}
          </span>
          <span className="text-3xl text-gradient-white-casablanca transition-transform duration-500 group-data-open:rotate-45 group-data-open:bg-none group-data-open:text-chambray group-data-open:[-webkit-text-fill-color:var(--color-chambray)]">
            +
          </span>
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Panel 
        keepMounted 
        hidden={false} 
        className="overflow-hidden "
      >
        <div 
          ref={panelRef} 
          className="h-0 opacity-0 overflow-hidden pointer-events-none data-open:pointer-events-auto"
        >
          <div
            className={`w-[90%] text-casablanca text-xl md:text-3xl pl-2 pr-6 pt-8 pb-16 mx-auto ${fonts.bricolage_grot400.className}`}
          >
            {service.description}
          </div>
        </div>
      </Accordion.Panel>
    </Accordion.Item>
  );
};

const AccordionMobile: React.FC = () => {
  return (
    <Accordion.Root className="flex flex-col w-full mx-auto  border-black/10">
      {services.map((serviceObj) =>
        Object.entries(serviceObj).map(([key, service], index) => (
          <AccordionItem 
            key={key} 
            value={key} 
            service={service} 
            isFirst={index === 0} 
          />
        ))
      )}
    </Accordion.Root>
  );
};

export default AccordionMobile;