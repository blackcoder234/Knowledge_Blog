"use client";

import { useState } from 'react';

const faqs = [
  {
    question: "Do you accept guest posts?",
    answer: "Yes, we welcome contributions from industry experts and researchers. Please review our submission guidelines on the 'Write for Us' page before sending your pitch."
  },
  {
    question: "How can I sponsor the newsletter?",
    answer: "We offer various sponsorship packages for our weekly newsletter. Contact our sales team via the form above with 'Collaboration' as the subject line for our media kit."
  },
  {
    question: "What is your editorial policy?",
    answer: "Our content is independently researched and fact-checked. We maintain strict editorial independence and do not allow sponsors to dictate our coverage."
  },
  {
    question: "Can I use your graphics in my presentation?",
    answer: "You may use our visualizations for educational or non-commercial purposes with proper attribution. For commercial use, please request a license."
  }
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div 
            key={idx} 
            className={`rounded-xl border transition-all duration-300 overflow-hidden ${
              openIndex === idx 
                ? 'bg-white/5 border-accent/30' 
                : 'bg-card border-white/5 hover:border-white/10'
            }`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="flex w-full items-center justify-between p-6 text-left"
            >
              <span className={`font-medium ${openIndex === idx ? 'text-accent' : 'text-white'}`}>
                {faq.question}
              </span>
              <span className={`ml-6 flex h-6 w-6 transform items-center justify-center rounded-full border border-white/10 transition-transform bg-white/5 ${
                openIndex === idx ? 'rotate-180' : ''
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-zinc-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </span>
            </button>
            <div 
                className={`transition-all duration-300 ease-in-out ${
                    openIndex === idx ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="px-6 pb-6 text-muted leading-relaxed">
                    {faq.answer}
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
