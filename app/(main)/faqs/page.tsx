"use client";

import { useState, useMemo } from "react";
import { Plus, Minus, Search } from "lucide-react";

/* FAQ DATA */

const faqData = [
  {
    category: "Security & Privacy",
    items: [
      {
        q: "Is my medical data secure on Medora?",
        a: "Yes. All records are encrypted and stored securely so only you and authorized healthcare professionals can access them.",
      },
      {
        q: "Who can access my records?",
        a: "Only you control access. Records remain private unless you choose to share them with a doctor or caregiver.",
      },
      {
        q: "What happens if I lose my device?",
        a: "Your data stays safe in the cloud and can be accessed again after secure login.",
      },
    ],
  },
  {
    category: "Using Medora",
    items: [
      {
        q: "What kind of records can I upload?",
        a: "You can upload prescriptions, lab reports, scans, and other medical documents.",
      },
      {
        q: "Do I need technical knowledge to use Medora?",
        a: "No. Medora is designed to be simple and easy for anyone to use.",
      },
      {
        q: "Is Medora free to use?",
        a: "Yes. You can start uploading and managing records without any upfront cost.",
      },
    ],
  },
  {
    category: "Access & Availability",
    items: [
      {
        q: "Can I access my records anytime?",
        a: "Absolutely. Your medical data stays available 24/7 from any device.",
      },
      {
        q: "Can I use Medora on mobile?",
        a: "Yes. Medora works across devices so your records are always accessible.",
      },
    ],
  },
  {
    category: "Sharing & Doctors",
    items: [
      {
        q: "Can I share my reports with doctors?",
        a: "Yes. Share securely without carrying physical files.",
      },
      {
        q: "Is sharing private and controlled?",
        a: "Yes. You decide who can access your records and can revoke access anytime.",
      },
    ],
  },
];

export default function FAQsPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  /* highlight search matches */

  const highlightText = (text: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));

    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-gray-200 px-1 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  /* flatten + filter + sort */

  const filteredFaqs = useMemo(() => {
    let all = faqData.flatMap((group) =>
      group.items.map((item) => ({ ...item, category: group.category }))
    );

    if (activeCategory !== "All") {
      all = all.filter((item) => item.category === activeCategory);
    }

    if (query) {
      all = all.filter(
        (item) =>
          item.q.toLowerCase().includes(query.toLowerCase()) ||
          item.a.toLowerCase().includes(query.toLowerCase())
      );
    }

    /* popular first */
    return all.sort((a, b) => a.q.length - b.q.length);
  }, [query, activeCategory]);

  return (
    <main className="bg-white text-black">

      {/* HERO */}
      <section className="py-24 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold">
          Frequently asked questions
        </h1>

        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          Everything you need to know about storing and managing medical
          records with Medora.
        </p>
      </section>

      {/* SEARCH */}
      <section className="max-w-3xl mx-auto px-6">
        <div className="flex items-center gap-3 border border-gray-200 rounded-full px-5 py-3 shadow-sm">
          <Search className="text-gray-400" />
          <input
            type="text"
            placeholder="Search questions..."
            className="w-full outline-none text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </section>

      {/* CATEGORY TABS */}
      <section className="sticky top-16 bg-white z-20 border-b mt-10">
        <div className="max-w-4xl mx-auto flex gap-6 px-6 py-4 overflow-x-auto text-sm">
          {["All", ...faqData.map((g) => g.category)].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap ${
                activeCategory === cat
                  ? "font-semibold text-black"
                  : "text-gray-500"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* FAQ ACCORDION */}
      <section className="py-16 px-6 max-w-3xl mx-auto">
        {filteredFaqs.map((item, index) => {
          const id = `${item.q}-${index}`;

          return (
            <div
              key={id}
              className="border-b border-gray-200 py-4 cursor-pointer"
              onClick={() =>
                setOpenIndex(openIndex === id ? null : id)
              }
            >
              <div className="flex justify-between items-center">
                <p className="font-medium">{highlightText(item.q)}</p>

                {openIndex === id ? (
                  <Minus className="text-gray-500" />
                ) : (
                  <Plus className="text-gray-500" />
                )}
              </div>

              <div
                className={`transition-all duration-300 overflow-hidden ${
                  openIndex === id ? "max-h-40 mt-3" : "max-h-0"
                }`}
              >
                <p className="text-sm text-gray-600">
                  {highlightText(item.a)}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* ASK QUESTION */}
      <section className="py-20 text-center px-6 border-t">
        <h2 className="text-2xl font-semibold">
          Didn’t find your answer?
        </h2>

        <p className="mt-3 text-gray-600">
          Ask a question and our team will help you.
        </p>

        <input
          type="text"
          placeholder="Ask your question..."
          className="mt-6 px-5 py-3 border border-gray-200 rounded-full w-full max-w-xl outline-none"
        />
      </section>

      {/* TRUST STRIP */}
      <section className="py-16 text-center">
        <p className="text-gray-600">
          Encrypted • Private • Secure • Always accessible
        </p>
      </section>
    </main>
  );
}
