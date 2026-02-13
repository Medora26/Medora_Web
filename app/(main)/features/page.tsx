"use client";

import {
  ShieldCheck,
  FolderKanban,
  Search,
  Share2,
  Smartphone,
  Clock,
  Bell,
  User,
  Users,
  Stethoscope,
  HeartPulse,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function FeaturesPage() {
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
    <main className="">

      {/* HERO */}
      <section className="py-24 px-6 text-center reveal max-w-4xl mx-auto ">
        <h1 className="text-4xl  md:text-6xl text-center  font-semibold tracking-normal">
          Powerful features for modern healthcare records
        </h1>

        <p className="mt-6 text-gray-600 max-w-2xl mx-auto text-lg">
          Secure, organized, and always accessible — Medora helps you manage your
          medical data with confidence.
        </p>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="max-w-6xl mx-auto px-6 pb-28 reveal">
        <div className="grid md:grid-cols-3 gap-8 " >

          <FeatureCard icon={<ShieldCheck />} title="Secure storage" desc="Advanced encryption protects every record." />
          <FeatureCard icon={<FolderKanban />} title="Smart organization" desc="Automatically categorize medical files." />
          <FeatureCard icon={<Search />} title="Instant search" desc="Find any report within seconds." />
          <FeatureCard icon={<Share2 />} title="Doctor sharing" desc="Share reports securely in one tap." />
          <FeatureCard icon={<Smartphone />} title="Access anywhere" desc="Available across devices, anytime." />
          <FeatureCard icon={<Clock />} title="Timeline history" desc="Track treatments and medical events." />
          <FeatureCard icon={<Bell />} title="Smart alerts" desc="Reminders for appointments & medications."  />

        </div>
      </section>

      {/* USE CASES */}
      <section className="py-28 px-6 max-w-6xl mx-auto reveal">
        <h2 className="text-3xl md:text-4xl font-semibold text-center">
          Built for real healthcare journeys
        </h2>

        <div className="grid md:grid-cols-4 gap-8 mt-16">
          <UseCase icon={<User />} title="Patients" />
          <UseCase icon={<Users />} title="Families" />
          <UseCase icon={<Stethoscope />} title="Doctors" />
          <UseCase icon={<HeartPulse />} title="Chronic care" />
        </div>
      </section>

      {/* DIFFERENTIATION */}
      <section className="py-28 px-6 max-w-6xl mx-auto reveal">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold">
            What makes Medora different
          </h2>

          <p className="mt-6 text-gray-600">
            Designed for real medical workflows — not just storage.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 mt-16">
          {[
            "Privacy-first design",
            "Structured medical timeline",
            "Instant doctor sharing",
            "No paper dependency",
          ].map((item) => (
            <div
              key={item}
              className="p-6 rounded-2xl dark:bg-neutral-950 border  shadow-sm"
            >
              <p className="font-medium">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WORKFLOW WITH PROGRESS LINE */}
      <section className="py-28 px-6 text-center relative reveal">
        <h3 className="text-3xl font-semibold">Simple, clear workflow</h3>

        <div className="relative mt-16 max-w-4xl mx-auto">

          {/* progress line */}
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-200" />

          <div className="flex justify-between relative">
            {["Upload", "Organize", "Access", "Share"].map((step, i) => (
              <div key={step} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold shadow">
                  {i + 1}
                </div>
                <p className="mt-3 text-sm text-gray-600">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 text-center px-6 reveal">
        <h2 className="text-3xl md:text-4xl font-semibold">
          Experience smarter medical record management
        </h2>

        <p className="mt-4 text-gray-600">
          Medora helps you stay prepared, organized, and in control of your health.
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

/* FEATURE CARD */

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-6 rounded-2xl dark:bg-neutral-950 border shadow-sm hover:shadow-md transition">
      <div className="w-11 h-11 flex items-center justify-center rounded-lg dark:bg-neutral-800 text-blue-600">
        {icon}
      </div>

      <h3 className="mt-4 font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  );
}

/* USE CASE CARD */

function UseCase({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="p-6 rounded-2xl dark:bg-neutral-950  border shadow-sm text-center">
      <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full dark:bg-neutral-900 text-blue-600">
        {icon}
      </div>

      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="text-sm text-gray-600 mt-2">
        Designed to support everyday healthcare needs.
      </p>
    </div>
  );
}
