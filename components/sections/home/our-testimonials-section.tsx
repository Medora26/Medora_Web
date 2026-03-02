'use client'
import SectionTitle from '@/components/section-title';
import { TestimonialsData } from '@/constant/constant';
import { StarIcon } from 'lucide-react';
import TestimonialsCard from './components/testimonialsCard';
import Marquee from 'react-fast-marquee';
import { useTheme } from 'next-themes';

export default function OurTestimonialSection() {
const marqueeData = [...TestimonialsData, ...TestimonialsData]
const {theme} = useTheme()
  return (
    <section id="testimonials" className='scroll-mt-8 flex flex-col items-center justify-center py-12  '>
      <SectionTitle
        title='What Our Users Say'
        subtitle='Real experiences from patients and healthcare professionals using Medora to manage medical records.'
      />

     <Marquee
  className="max-w-6xl mx-auto mt-12 py-2 overflow-clip"
 gradientColor={theme === 'dark' ? "black" : "white"}
  gradient
  speed={30}
>
  <div className="flex gap-6">
    {marqueeData.map((testimonial, index) => (
      <TestimonialsCard
        key={`top-${testimonial.name}-${index}`}
        data={testimonial}
      />
    ))}
  </div>
</Marquee>

<Marquee
  className="max-w-6xl mx-auto mt-2 py-2 overflow-clip"
  gradientColor={theme === 'dark' ? "black" : "white"}
  gradient
 
  direction="right"
  speed={25}
>
  <div className="flex gap-6">
    {marqueeData.map((testimonial, index) => (
      <TestimonialsCard
        key={`bottom-${testimonial.name}-${index}`}
        data={testimonial}
      />
    ))}
  </div>
</Marquee>
    </section>
  );
}
