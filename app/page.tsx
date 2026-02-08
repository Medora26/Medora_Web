import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import HeroSection from "@/components/sections/hero-section";
import WhatWeDoSection from "@/components/sections/what-we-do-section";
import OurLatestCreations from "@/components/sections/our-latest-creations";
import OurTestimonialSection from "@/components/sections/our-testimonials-section"
import FaqSection from "@/components/sections/faq-section"
import Newsletter from "@/components/sections/newsletter"
export default function Home() {
  return (
    <>
    

      <main className="min-h-screen">
        <HeroSection />
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
