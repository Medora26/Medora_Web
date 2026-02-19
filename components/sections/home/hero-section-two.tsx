'use client'
import Navbar from '@/components/navbar'
import { companiesLogo } from '@/public/logo/logo'
import { VideoIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import Marquee from "react-fast-marquee"
const HeroSectionTwo = () => {
    const {theme} = useTheme()
    console.log("Hello world")
  return (
   <div className="flex flex-col items-center justify-center text-center px-4 bg-[url('/images/light-hero-gradient.png')] dark:bg-[url('/images/dark-hero-gradient.png')] bg-no-repeat bg-cover">
    <Navbar/>
                <div className="flex flex-wrap items-center justify-center gap-3 p-1.5 pl-4 pr-4 mt-46 rounded-full border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-600/20">
                   {/*  <div className="flex items-center -space-x-3">
                         <Image className="size-7 rounded-full" height={50} width={50}
                            src=""
                            alt="userImage1" />
                        <Image className="size-7 rounded-full" height={50} width={50}
                            src=""
                            alt="userImage2" />
                        <Image className="size-7 rounded-full" height={50} width={50}
                            src=""
                            alt="userImage3" /> 
                    </div> */}
                    <p className="text-xs">Join community of 1m+ founders </p>
                </div>
                <h1 className="mt-2 text-5xl/15 md:text-[64px]/19 font-semibold max-w-4xl">
                    Access Your Medical Record, Anytime,{" "}
                    <span className="bg-gradient-to-r  from-blue-600 dark:from-blue-600 to-blue-700 dark:to-blue-200 bg-clip-text text-transparent"> Anywhere</span>
                </h1>
                <p className="text-base dark:text-slate-300 max-w-xl font-semibold mt-4">
                    Medora helps you securely manage prescriptions, lab reports, and health history
        in one place — private, encrypted, and always available when you need it.
                </p>
                <div className="flex items-center gap-4 mt-8">
                    <Link href="/sign-up" className="py-3 md:py-2.5 w-full md:w-auto px-8 border  bg-linear-to-tl from-blue-600 to-blue-500 text-white text-center rounded-full">
                            Get Started
                        </Link>
                    <Link href="/sign-in" className="relative py-3 md:py-2.5 w-full md:w-auto px-8  dark:bg-neutral-950 font-medium text-center border  rounded-full">
                            Start Storing
                           
                        </Link>
                </div>
                <h3 className="text-base text-center text-slate-400 mt-14 pb-16 font-medium">
                    Trusting by leading brands, including —
                </h3>
                <Marquee className="max-w-5xl mx-auto" gradient={true} speed={25} gradientColor={theme === "dark" ? "#000" : "#fff"}>
                                  <div className="flex items-center justify-center">
                                       {[...companiesLogo, ...companiesLogo].map((company, index) => (
                                          <Image key={index} className="mx-11" src={company.logo} alt={company.name} width={100} height={100} />
                                      ))} 
                                  </div>
                              </Marquee>
            </div>
  )
}

export default HeroSectionTwo