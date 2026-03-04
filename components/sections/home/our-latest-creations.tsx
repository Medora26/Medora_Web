'use client'
import SectionTitle from "@/components/section-title";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { cn } from "@/lib/utils";
import { HOMEPAGE } from "@/public/images/images";
import { Public } from "@/public/public";
import { useTheme } from "next-themes";
import Image from "next/image";

export default function OurLatestCreations() {
 const {theme} = useTheme()

  return (
    <section  id="creations" className="scroll-mt-12 flex flex-col items-center justify-center   text-black">
     <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl font-semibold text-black dark:text-white">
             Your Most Sensitive Data. <br />
              <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                Perfectly Protected.
              </span>
            </h1>
          </>
        }
      >
        <Image
          src={
             theme === 'dark' ? Public.DASHBOARD_DARK : Public.DASHBOARD_LIGHT
          }
          alt="hero"
          height={720}
          width={1400}
          className={
            cn(
              'mx-auto rounded-2xl object-contain h-full', 
              theme === 'light' ? "bg-white" : "bg-black"
            )
          }
          draggable={false}
        />
      </ContainerScroll>
    </div>
    </section>
  );
}
