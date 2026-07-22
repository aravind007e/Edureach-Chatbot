import { useState, useEffect } from "react";
import { quotesContent } from "../data/content";
import { Quote as QuoteIcon, ChevronLeft, ChevronRight } from "lucide-react";

export default function QuotesSection() {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);

  // Auto-rotate every 6 seconds with fade effect
  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % quotesContent.length);
        setFade(true);
      }, 300);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index: number) => {
    setFade(false);
    setTimeout(() => {
      setCurrent(index);
      setFade(true);
    }, 300);
  };

  const prev = () => goTo((current - 1 + quotesContent.length) % quotesContent.length);
  const next = () => goTo((current + 1) % quotesContent.length);

  return (
    <section className="py-24 bg-white border-b border-slate-100 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 relative">
        
        {/* Testimonial Card */}
        <div className="bg-[#F8FAFC] border border-slate-150 rounded-[24px] p-8 md:p-14 shadow-sm relative overflow-hidden">
          
          {/* Watermark Quote Icon */}
          <QuoteIcon className="w-24 h-24 text-[#2563EB]/5 absolute -top-4 -left-4 pointer-events-none" />

          <div className="relative min-h-[140px] flex items-center justify-center">
            {/* Quote Text - fades in/out */}
            <div
              className="px-6 md:px-12 text-center transition-opacity duration-300"
              style={{ opacity: fade ? 1 : 0 }}
            >
              <p className="font-heading text-lg sm:text-xl md:text-2xl text-[#0F172A] font-medium leading-[1.8] mb-6 italic">
                &ldquo;{quotesContent[current].text}&rdquo;
              </p>
              <p className="text-[#2563EB] font-bold text-xs uppercase tracking-widest">&mdash; {quotesContent[current].author}</p>
            </div>
          </div>
        </div>

        {/* Navigation Arrows & Dots row */}
        <div className="flex items-center justify-between mt-8 max-w-[200px] mx-auto">
          <button onClick={prev} 
            className="w-10 h-10 bg-white hover:bg-slate-50 border border-slate-200 text-[#475569] hover:text-[#2563EB] rounded-full flex items-center justify-center shadow-sm transition-all duration-200 cursor-pointer"
            aria-label="Previous testimonial">
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {quotesContent.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === current ? "bg-[#2563EB] w-6" : "bg-slate-200 hover:bg-slate-350"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>

          <button onClick={next}
            className="w-10 h-10 bg-white hover:bg-slate-50 border border-slate-200 text-[#475569] hover:text-[#2563EB] rounded-full flex items-center justify-center shadow-sm transition-all duration-200 cursor-pointer"
            aria-label="Next testimonial">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </section>
  );
}