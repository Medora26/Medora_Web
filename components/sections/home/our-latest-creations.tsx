import SectionTitle from "@/components/section-title";
import { HOMEPAGE } from "@/public/images/images";
import Image from "next/image";

export default function OurLatestCreations() {

  const data = [
    {
      title: 'Digital Prescriptions',
      description: 'Store and access prescriptions securely anytime without worrying about losing paper records.',
      image: HOMEPAGE.ONE,
    },
    {
      title: 'Lab Reports & Scans',
      description: 'Keep all medical reports, scans, and test results organized in one safe digital place.',
      image: HOMEPAGE.TWO,
    },
    {
      title: 'Health History Timeline',
      description: 'Track treatments, diagnoses, and doctor visits with a complete medical history timeline.',
      image: HOMEPAGE.THREE,
    },
  ];

  return (
    <section  id="creations" className="scroll-mt-12 flex flex-col items-center justify-center py-16  text-black">

      <SectionTitle
        title="Medical Records in One Place"
        subtitle="Everything you need to manage prescriptions, reports, and health history — securely and instantly."
      />

      <div className="flex flex-wrap items-center justify-center gap-10 mt-12">
        {data.map((item, index) => (
          <div key={index} className="max-w-80 hover:-translate-y-0.5 transition duration-300">
            <Image className="rounded-xl" src={item.image} alt={item.title} />
            <h3 className="text-base font-semibold text-slate-700 mt-4">{item.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
