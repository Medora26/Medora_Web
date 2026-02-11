import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import HeroSection from "@/components/sections/home/hero-section";
import WhatWeDoSection from "@/components/sections/home/what-we-do-section";
import OurLatestCreations from "@/components/sections/home/our-latest-creations";
import OurTestimonialSection from "@/components/sections/home/our-testimonials-section"
import FaqSection from "@/components/sections/home/faq-section"
import Newsletter from "@/components/sections/home/newsletter"
import HeroSectionTwo from "@/components/sections/home/hero-section-two";
export default function Home() {
  return (
    <>
    

      <main className="min-h-screen">
        <HeroSectionTwo/>
        <WhatWeDoSection />
        <OurLatestCreations />
        <OurTestimonialSection />
        <FaqSection />
        <Newsletter />
      </main>

      <Footer />
    </>
  );
}
