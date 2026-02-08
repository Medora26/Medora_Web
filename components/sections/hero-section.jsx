'use client';

import Link from "next/link";


export default function HeroSection() {

  return (
    <section className="flex flex-col items-center justify-center relativemin-h-[80vh] py-12 overflow-hidden">

      {/* BACKGROUND GRADIENT */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-gray-100 to-white" />

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
<div className="w-full flex justify-center mt-8">
 <Link href="/onboarding">
  <button className="px-8 py-3 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition">
    Upload Records
  </button>
</Link>

</div>


      {/* FEATURE HIGHLIGHTS */}
      <div className="flex flex-wrap justify-center gap-6 mt-14 text-sm text-gray-500">
        <span>🔒 End-to-end encrypted</span>
        <span>📄 Store prescriptions & reports</span>
        <span>📱 Access anytime</span>
        <span>🩺 Share with doctors securely</span>
      </div>

    </section>
  );
}
