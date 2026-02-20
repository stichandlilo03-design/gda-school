"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Search, HelpCircle, BookOpen, MessageSquare } from "lucide-react";
import Link from "next/link";

interface HelpSection {
  icon: string;
  title: string;
  description: string;
  steps: string[];
  tips?: string[];
  link?: string;
}

interface FAQ {
  q: string;
  a: string;
}

export default function HelpPage({
  portalName,
  portalColor,
  sections,
  faqs,
  messagesLink,
}: {
  portalName: string;
  portalColor: string;
  sections: HelpSection[];
  faqs: FAQ[];
  messagesLink: string;
}) {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openSection, setOpenSection] = useState<number | null>(0);

  const filteredSections = sections.filter(
    (s) =>
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.steps.some((st) => st.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredFaqs = faqs.filter(
    (f) => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className={`bg-gradient-to-r ${portalColor} rounded-2xl p-6 text-white`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Help Center</h1>
            <p className="text-sm opacity-80">Everything you need to know about the {portalName} Portal</p>
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <input
            className="w-full bg-white/20 border border-white/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/60 outline-none focus:bg-white/30"
            placeholder="Search help topics, FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Quick Start */}
      {!search && (
        <div className="card border-2 border-dashed border-brand-200 bg-brand-50/30">
          <h2 className="text-sm font-bold text-brand-800 mb-2">🚀 Quick Start Guide</h2>
          <p className="text-xs text-brand-600">New here? Follow these steps to get started:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sections.slice(0, 4).map((s, i) => (
              <button
                key={i}
                onClick={() => setOpenSection(i)}
                className="text-[10px] px-3 py-1.5 rounded-lg bg-white border border-brand-200 text-brand-700 font-medium hover:bg-brand-100 transition"
              >
                {s.icon} {s.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* How-To Sections */}
      <div>
        <h2 className="text-sm font-bold text-gray-800 mb-3">
          <BookOpen className="w-4 h-4 inline mr-1" /> How To Use Each Feature
        </h2>
        <div className="space-y-2">
          {filteredSections.map((section, i) => {
            const isOpen = openSection === i;
            return (
              <div key={i} className="card">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setOpenSection(isOpen ? null : i)}
                >
                  <span className="text-xl">{section.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-800">{section.title}</h3>
                    <p className="text-[10px] text-gray-500">{section.description}</p>
                  </div>
                  {section.link && (
                    <Link
                      href={section.link}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] px-2 py-1 rounded-lg bg-brand-50 text-brand-600 font-medium hover:bg-brand-100"
                    >
                      Go →
                    </Link>
                  )}
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <ol className="space-y-2">
                      {section.steps.map((step, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                            {j + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                    {section.tips && section.tips.length > 0 && (
                      <div className="mt-3 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-700 mb-1">💡 Tips</p>
                        {section.tips.map((tip, j) => (
                          <p key={j} className="text-[10px] text-amber-600">• {tip}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filteredSections.length === 0 && (
            <p className="text-center text-xs text-gray-400 py-4">No matching help topics found</p>
          )}
        </div>
      </div>

      {/* FAQs */}
      <div>
        <h2 className="text-sm font-bold text-gray-800 mb-3">❓ Frequently Asked Questions</h2>
        <div className="space-y-2">
          {filteredFaqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={i} className="card">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setOpenFaq(isOpen ? null : i)}>
                  <span className="text-xs font-bold text-brand-600">Q</span>
                  <p className="text-xs font-medium text-gray-800 flex-1">{faq.q}</p>
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </div>
                {isOpen && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
          {filteredFaqs.length === 0 && (
            <p className="text-center text-xs text-gray-400 py-4">No matching FAQs found</p>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="card bg-gray-50 text-center">
        <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-gray-700">Still need help?</h3>
        <p className="text-xs text-gray-500 mt-1">Contact your school administrator or send a message through the Messages page.</p>
        <Link href={messagesLink} className="inline-block mt-3 text-xs px-4 py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700">
          Go to Messages
        </Link>
      </div>
    </div>
  );
}
