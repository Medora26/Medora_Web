import SectionTitle from "@/components/section-title";

export default function Newsletter() {
  return (
    <section className="flex flex-col items-center justify-center bg-white py-16 text-black">
      <SectionTitle
        title="Stay Updated with Medora"
        subtitle="Get health tips, feature updates, and reminders to manage your medical records better."
      />

      <div className="w-full max-w-2xl mt-10">
        
        {/* Desktop */}
        <div className="hidden md:flex items-center gap-2 bg-white rounded-full p-2 shadow-md border border-slate-200">
          
          <input
            type="email"
            placeholder="Enter your email to get health tips & updates"
            className="flex-1 px-5 py-3 text-sm rounded-full bg-transparent outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-200 transition"
          />

          <button className="px-7 py-3 rounded-full text-white font-medium bg-gradient-to-r from-indigo-600 to-violet-500 hover:scale-[1.02] active:scale-95 transition-all shadow-sm">
            Get Health Updates
          </button>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex flex-col gap-3">
          <input
            type="email"
            placeholder="Enter your email to get health tips & updates"
            className="w-full px-5 py-3 text-sm rounded-full bg-white outline-none border border-slate-200 shadow-sm placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-200 transition"
          />

          <button className="w-full py-3 rounded-full text-white font-medium bg-gradient-to-r from-indigo-600 to-violet-500 hover:scale-[1.02] active:scale-95 transition-all shadow-sm">
            Get Health Updates
          </button>
        </div>

      </div>
    </section>
  );
}
