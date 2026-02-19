'use client'
import React, { ReactNode, useEffect } from 'react'
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MedoraGlobe from './component/globe/medora-globe';

gsap.registerPlugin(ScrollTrigger);

interface Props {
     children: ReactNode
}


const ContactLayout = ({children}:Props) => {

  useEffect(() => {
    const sections = gsap.utils.toArray(".reveal");

    sections.forEach((section: any) => {
      gsap.fromTo(
        section,
        { opacity: 0, y: 70 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
          },
        }
      );
    });
  }, []);
  return (
    <section className='py-10'>
        <div className='container mx-auto'>
            <div className='flex flex-col items-center' >
                <section className=" px-6 text-center reveal max-w-4xl mx-auto ">
        <h1 className="text-4xl  md:text-5xl text-center  font-semibold tracking-normal">
          Collaborate With <span className='text-blue-600'>Medora</span>
        </h1>

        <p className=" max-w-2xl mx-auto text-lg">
          Tell us who you are, what you love building, and how you’d like to contribute.
        </p>
                </section>
                <div className='mt-12 grid grid-cols-1 md:grid-cols-2 w-full gap-5'>
                <section className=''>{children}</section>
                <section className='hidden md:block'>
                   <MedoraGlobe 
      initialLat={20}
      initialLng={10}
      size={600} // Fixed size in pixels
      autoRotate={true}
      rotationSpeed={1}
      className="w-full h-full"
    />
                </section>
               </div>
            </div>
        </div>
    </section>
  )
}

export default ContactLayout