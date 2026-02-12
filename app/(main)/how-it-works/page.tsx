"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function HowItWorksPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sections = gsap.utils.toArray(".reveal");

    sections.forEach((section: any) => {
      gsap.fromTo(
        section,
        { opacity: 0, y: 80 },
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
    <main
      ref={containerRef}
      className="bg-gradient-to-b from-white via-blue-50/60 to-white text-black"
    >
      {/* HERO */}
      <section className="relative py-24 px-6 text-center overflow-hidden reveal">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-blue-100/40 to-white" />

        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
          How Medora Works
        </h1>

        <p className="mt-6 text-gray-600 max-w-2xl mx-auto text-lg">
          From uploading reports to accessing them anywhere — Medora keeps your
          medical history secure, organized, and always available.
        </p>
      </section>

      {/* PRODUCT WALKTHROUGH */}
      <section className="max-w-6xl mx-auto px-6">

        {/* BLOCK 1 */}
        <div className="py-24 flex flex-col md:flex-row items-center gap-16 reveal">
          <div className="flex-1 relative">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-200/30 blur-3xl rounded-full" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-200/30 blur-3xl rounded-full" />

            <div className="relative rounded-[22px] border border-gray-200 bg-white shadow-2xl p-3">
              <div className="rounded-xl overflow-hidden">
                <Image
                  src="/light.png"
                  alt="Medora homepage"
                  width={1000}
                  height={600}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-xs tracking-widest text-indigo-600 font-semibold">
              STEP 01
            </p>
            <h2 className="text-3xl font-semibold mt-2">Discover Medora</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              A clean and intuitive interface designed to help you understand your
              health data instantly and take control of your medical records.
            </p>
          </div>
        </div>

        {/* BLOCK 2 */}
        <div className="py-24 flex flex-col md:flex-row-reverse items-center gap-16 reveal">
          <div className="flex-1">
            <div className="rounded-2xl h-[360px] bg-white/70 backdrop-blur-md border border-gray-200 shadow-xl" />
          </div>

          <div className="flex-1">
            <p className="text-xs tracking-widest text-indigo-600 font-semibold">
              STEP 02
            </p>
            <h2 className="text-3xl font-semibold mt-2">Upload records</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Upload prescriptions, reports, and scans easily with a seamless
              drag-and-drop experience.
            </p>
          </div>
        </div>

        {/* BLOCK 3 */}
        <div className="py-24 flex flex-col md:flex-row items-center gap-16 reveal">
          <div className="flex-1">
            <div className="rounded-2xl h-[360px] bg-white/70 backdrop-blur-md border border-gray-200 shadow-xl" />
          </div>

          <div className="flex-1">
            <p className="text-xs tracking-widest text-indigo-600 font-semibold">
              STEP 03
            </p>
            <h2 className="text-3xl font-semibold mt-2">Organized dashboard</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              View your entire medical history in one place — categorized,
              searchable, and structured for quick access anytime.
            </p>
          </div>
        </div>

        {/* BLOCK 4 */}
        <div className="py-24 flex flex-col md:flex-row-reverse items-center gap-16 reveal">
          <div className="flex-1">
            <div className="rounded-2xl h-[360px] bg-white/70 backdrop-blur-md border border-gray-200 shadow-xl" />
          </div>

          <div className="flex-1">
            <p className="text-xs tracking-widest text-indigo-600 font-semibold">
              STEP 04
            </p>
            <h2 className="text-3xl font-semibold mt-2">Access & share securely</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Share reports with doctors instantly and access them from any device —
              while keeping your data private and protected.
            </p>
          </div>
        </div>

      </section>

      {/* CTA */}
      <section className="py-28 text-center px-6 reveal">
        <h2 className="text-3xl md:text-4xl font-semibold">
          Start managing your medical records today
        </h2>

        <p className="mt-4 text-gray-600">
          Join Medora and keep your health data organized and accessible.
        </p>

        <Link
          href="/onboarding"
          className="inline-block mt-10 px-10 py-4 rounded-full text-white font-medium bg-gradient-to-r from-indigo-600 to-blue-500 hover:scale-[1.03] transition shadow-lg"
        >
          Get Started
        </Link>
      </section>

    </main>
  );
}
