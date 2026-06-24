"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { faqItems as defaultItems, type FAQItem } from "@/lib/faq";

interface Props {
  items?: FAQItem[];
}

export default function FAQAccordion({ items = defaultItems }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const open = openIndex === idx;
        const panelId = `faq-panel-${idx}`;
        const buttonId = `faq-button-${idx}`;
        return (
          <div key={idx} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <button
              id={buttonId}
              aria-expanded={open}
              aria-controls={panelId}
              className="flex w-full items-center justify-between gap-4 p-4 text-left font-medium text-gray-900 transition-colors hover:bg-gray-50"
              onClick={() => setOpenIndex(open ? null : idx)}
            >
              <span>{item.question}</span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-brand-blue transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
            {open && (
              <div id={panelId} role="region" aria-labelledby={buttonId} className="px-4 pb-4 text-sm text-gray-600">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
