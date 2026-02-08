'use client';

import Link from "next/link";
import AnimatedContent from "./home/animated-content";
import { StarIcon } from "lucide-react";
import Image from "next/image";
import Navbar from "../navbar";

export default function HeroSection() {

  return (
   <section
    
    className="bg-[url('/images/hero.png')] bg-cover bg-center bg-no-repeat px-4 md:px-16 lg:px-24 xl:px-32"
   >
      <Navbar />
     <div className="max-w-7xl mx-auto flex flex-col items-center justify-center h-screen">
                    <AnimatedContent reverse distance={30} className="flex items-center gap-2 backdrop-blur p-1 -mt-20 rounded-full ">
                        <div className="flex items-center -space-x-3">
                            <img className="size-7 rounded-full border "
                                src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=50"
                                alt="userImage1" />
                            <img className="size-7 rounded-full border-2 border-white"
                                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=50"
                                alt="userImage2" />
                        </div>
                        <span>60K+</span>
                        <div className="h-5 w-px mx-1 rounded-full" />
                        <span>Trusted by healthcare professionals</span>
                        <div className="h-5 w-px mx-1 rounded-full" />
                        <div className="flex items-center gap-1 pr-3">
                            <StarIcon className="size-4.5 fill-orange-500 stroke-orange-500" />
                            <span>4.9</span>
                        </div>
                    </AnimatedContent>
                    <AnimatedContent distance={30} delay={0.1} className="relative">
                        <div className="flex flex-col items-center ">
                         <span
                          className="font-bold text-4xl md:text-7xl/tight max-w-7xl  text-center"
                         ><span
                         className="bg-gradient-to-r from-neutral-400 to-neutral-950 text-transparent bg-clip-text"
                         >Access</span> Your <span className="bg-gradient-to-r from-blue-600 to-blue-300 text-transparent bg-clip-text">Medical Record,</span> Anytime, Anywhere</span>
                          
                        </div>
                        <div className="absolute -top-5 right-13 hidden md:block">
                            {/* <CustomIcon icon={SparkleIcon} dir="right" /> */}
                        </div>
                    </AnimatedContent>
                    <AnimatedContent distance={30} delay={0.2}>
                        <p className="text-center text-base/7 font-semibold   max-w-xl mt-4">
                            Medora helps you securely manage prescriptions, lab reports, and health history
        in one place — private, encrypted, and always available when you need it.
                        </p>
                    </AnimatedContent>
                    <AnimatedContent className="flex flex-col md:flex-row items-center gap-4 mt-6 w-full md:w-auto">
                        <Link href="/sign-up" className="py-3 md:py-2.5 w-full md:w-auto px-8 border border-blue-200 bg-linear-to-tl from-blue-600 to-blue-500 text-white text-center rounded-full">
                            Get Started
                        </Link>
                        <Link href="/sign-in" className="relative py-3 md:py-2.5 w-full md:w-auto px-8  bg-indigo-100 font-medium text-center border  rounded-full">
                            Start Storing
                           
                        </Link>
                    </AnimatedContent>
                </div>
   </section>
  );
}
