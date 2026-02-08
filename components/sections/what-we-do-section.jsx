import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

export default function WhatWeDoSection() {
  return (
   <section className="flex flex-col md:flex-row items-center justify-center gap-20 py-16 px-4 bg-white">
  
<div className="relative shrink-0">

  {/* image */}
  <img
    src="/images/Medora-auth-layout.png"
    alt="medical records"
    className="relative max-w-sm w-full rounded-2xl object-cover"
  />

</div>
      {/* TEXT SIDE */}
      <div className="text-sm text-gray-400 max-w-md">
        <h1 className="text-xl uppercase font-semibold text-black">
          What Medora does
        </h1>

        <div className="w-24 h-[3px] rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 mt-2"></div>

        <p className="mt-8">
          Medora lets you store and manage all your medical records digitally —
          prescriptions, lab reports, scans, and health history.
        </p>

        <p className="mt-4">
          Access your health data anytime, anywhere without searching through files,
          papers, or hospital systems.
        </p>

        <p className="mt-4">
          Share reports securely with doctors, track treatments, and keep your entire
          medical journey organized in one place.
        </p>

        <Link
          href="/onboarding"
          className="flex items-center gap-2 mt-8 transition bg-white text-black hover:bg-gray-200 py-3 px-8 rounded-full w-fit"
        >
          <span>Start uploading records</span>
          <ArrowRightIcon className="size-5" />
        </Link>
      </div>

    </section>
  );
}
