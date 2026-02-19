'use client'
import ContactForm from '@/components/layouts/contact/component/contact-form'
import MedoraGlobe, { MedoraGlobeRef } from '@/components/layouts/contact/component/globe/medora-globe'
import React, { useEffect, useRef, useState } from 'react'
import { gsap } from "gsap"
import { ScrollTrigger } from 'gsap/all'

const Page = () => {
  gsap.registerPlugin(ScrollTrigger);
  const globeRef = useRef<MedoraGlobeRef>(null);
  const [isGlobeAnimating, setIsGlobeAnimating] = useState(false);

  // Geocoding function
  const geocodeLocation = async (location: string) => {
    setIsGlobeAnimating(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
        {
          headers: {
            'User-Agent': 'MedoraApp/1.0',
          },
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        
        // Use addPointer which already includes flying to location
        if (globeRef.current) {
          globeRef.current.addPointer(
            parseFloat(lat), 
            parseFloat(lon), 
            display_name
          );
        }
        
        return {
          lat: parseFloat(lat),
          lng: parseFloat(lon),
          name: display_name,
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    } finally {
      setIsGlobeAnimating(false);
    }
  };

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
        <div className='flex flex-col items-center'>
          <section className="px-6 text-center reveal max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl text-center font-semibold tracking-normal">
              Collaborate With <span className='text-blue-600'>Medora</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg">
              Tell us who you are, what you love building, and how you’d like to contribute.
            </p>
          </section>
          
          <div className='mt-12 grid grid-cols-1 md:grid-cols-2 w-full gap-5'>
            <section className=''>
              <ContactForm
                isGlobeAnimating={isGlobeAnimating}
                onLocationSubmit={geocodeLocation}
              />
            </section>
            
            <section className='hidden md:block'>
              <MedoraGlobe
                ref={globeRef}
                size={500}
                autoRotate={!isGlobeAnimating}
                rotationSpeed={0.5}
              />
            </section>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Page