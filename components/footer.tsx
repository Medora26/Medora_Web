import { LOGO } from "@/public/logo/logo";
import { LinkedinIcon, TwitterIcon, YoutubeIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const data = [
    {
      title: "Product",
      links: [
        { title: "Features", href: "#features" },
        { title: "Security", href: "#security" },
        { title: "Integrations", href: "#integrations" },
        { title: "Pricing", href: "#pricing" },
      ],
    },
    {
      title: "Company",
      links: [
        { title: "About", href: "#about" },
        { title: "Careers", href: "#careers" },
        { title: "Blog", href: "#blog" },
        { title: "Contact", href: "#contact" },
      ],
    },
    {
      title: "Legal",
      links: [
        { title: "Terms", href: "#terms" },
        { title: "Privacy", href: "#privacy" },
        { title: "Compliance", href: "#compliance" },
      ],
    },
  ];

  return (
    <footer className="px-4 md:px-16 lg:px-24 py-16 ">
      <div className="flex flex-col md:flex-row justify-between gap-12">

        {/* Brand */}
        <div className="max-w-sm">
          <Link href="/">
          <Image
            src={LOGO.MEDORA_LOGO}
            alt="Medora"
            width={90}
            height={10}
            className=" w-32 object-contain"
            priority
          />
        </Link>
          <p className="mt-3 text-sm">
            Securely store, manage and access medical records anytime.
            Built for patients and healthcare providers.
          </p>

          {/* Socials */}
          <div className="flex gap-4 mt-6">
            <TwitterIcon className="w-5 h-5 hover:text-indigo-600 cursor-pointer" />
            <LinkedinIcon className="w-5 h-5 hover:text-indigo-600 cursor-pointer" />
            <YoutubeIcon className="w-5 h-5 hover:text-indigo-600 cursor-pointer" />
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-12">
          {data.map((item, index) => (
            <div key={index}>
              <p className="font-semibold text-neutral-500">{item.title}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {item.links.map((link, i) => (
                  <li key={i}>
                    <Link href={link.href} className="hover:text-blue-600 font-semibold transition">
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom line */}
      <div className="mt-12 border-t pt-6 text-sm text-gray-500 flex flex-col md:flex-row justify-between">
        <p>© {new Date().getFullYear()} Medora. All rights reserved.</p>
        <p>Built for modern healthcare.</p>
      </div>
    </footer>
  );
}
