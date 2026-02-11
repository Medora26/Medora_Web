import SectionTitle from "@/components/section-title";

export default function Newsletter() {
  return (
    <section id="newsletter" className="scroll-mt-12 flex flex-col items-center justify-center py-16 ">
      <SectionTitle
        title="Stay Updated with Medora"
        subtitle="Get health tips, feature updates, and reminders to manage your medical records better."
      />

      <div className="w-full max-w-2xl mt-10">
        
        {/* Desktop */}
        <div className="hidden md:flex items-center gap-2 bg-white-300 rounded-full p-2 shadow-sm border border-gray-200">
  
  <input
    type="email"
    placeholder="Enter your email to get health tips & updates"
    className="flex-1 px-5 py-3 text-sm rounded-full bg-transparent outline-none placeholder:text-slate-500 focus:ring-0"
  />

  <button className="px-7 py-3 rounded-full text-white font-medium bg-gradient-to-r from-indigo-600 to-violet-500 hover:scale-[1.02] active:scale-95 transition-all shadow-sm whitespace-nowrap">
    Get Health Updates
  </button>

</div>

      </div>
    </section>
  );
}
