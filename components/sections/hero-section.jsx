'use client';

import Link from "next/link";

export default function HeroSection() {

  return (
    <section id="home" className="scroll-mt-20 flex flex-col items-center justify-center relativemin-h-[80vh] py-12 overflow-hidden">

      {/* BACKGROUND GRADIENT */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-gray-100 to-white" />
<div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.04),_transparent_60%)]" />


      {/* TRUST BADGE */}
      <div className="flex items-center justify-center p-1.5 rounded-full border border-gray-200">
        <p className="pl-3 pr-3 text-gray-600 text-sm">
          Trusted by patients & healthcare professionals
        </p>
      </div>

      {/* HEADLINE */}
<h1 className="text-4xl md:text-6xl/18 text-center font-semibold max-w-3xl mt-6 text-black">
  Store your medical records.
  <span className="block text-2xl md:text-4xl bg-gradient-to-r from-indigo-600 to-blue-400 text-transparent bg-clip-text">
    Access them anytime, anywhere.
  </span>
</h1>



      {/* SUBTEXT */}
      <p className="text-slate-600 md:text-base text-center max-w-xl mt-4 px-4">
        Medora helps you securely manage prescriptions, lab reports, and health history
        in one place — private, encrypted, and always available when you need it.
      </p>

      {/* CTA */}
<div className="flex justify-center mt-8">
  <Link href="/onboarding">
    <button className="px-8 h-12 rounded-full text-white font-medium bg-gradient-to-r from-indigo-600 to-violet-500 hover:scale-[1.02] active:scale-95 transition-all shadow-sm whitespace-nowrap cursor-pointer">
      Upload Records
    </button>
  </Link>
</div>



     {/* FEATURE HIGHLIGHTS */}
<div className="flex flex-wrap justify-center gap-4 mt-14 text-sm">
  <span className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-gray-600">
    🔒 End-to-end encrypted
  </span>

  <span className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-gray-600">
    📄 Store prescriptions & reports
  </span>

  <span className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-gray-600">
    📱 Access anytime
  </span>

  <span className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-gray-600">
    🩺 Share with doctors securely
  </span>
</div>


    </section>
  );
}
