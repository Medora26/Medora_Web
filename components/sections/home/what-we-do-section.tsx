import { HOMEPAGE } from "@/public/images/images";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function WhatWeDoSection() {
  return (
   <section id="what-we-do" className="scroll-mt-12 flex flex-col md:flex-row items-center justify-center gap-20 py-16 px-4 ">
  
<div className="relative shrink-0">

  {/* image */}
  <Image
  className="relative max-w-md w-full rounded-2xl object-cover"
  alt=""
  src={HOMEPAGE.WHAT}
  />

</div>
      {/* TEXT SIDE */}
      <div className="text-sm  max-w-md">
        <h1 className="text-xl uppercase font-semibold ">
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
  className="flex items-center gap-2 mt-8 bg-white text-gray-900 py-3 px-8 rounded-full w-fit border border-gray-200 shadow-sm hover:bg-gray-100 transition"
>

          <span>Start uploading records</span>
          <ArrowRightIcon className="size-5" />
        </Link>
      </div>

    </section>
  );
}
