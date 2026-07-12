import { useEffect, useRef } from "react";
import { mentorsContent } from "../data/content";
import { Sparkles } from "lucide-react";

interface MentorsSectionProps {
  onReachMentors?: () => void;
}

export default function MentorsSection({ onReachMentors }: MentorsSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggered = useRef(false);

  // Simple scroll check - when section is in view, call the callback
  useEffect(() => {
    const handleScroll = () => {
      if (triggered.current || !sectionRef.current || !onReachMentors) return;

      const rect = sectionRef.current.getBoundingClientRect();
      // When the section top is within the viewport
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        triggered.current = true;
        onReachMentors();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [onReachMentors]);

  return (
    <section id="mentors" ref={sectionRef} className="py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-3">
          <p className="text-[#2563EB] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#2563EB]" /> LEARN FROM THE BEST
          </p>
          <h2 className="font-heading text-[30px] md:text-[40px] font-[700] text-[#0F172A] tracking-tight">
            Popular Mentors
          </h2>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible">
          {mentorsContent.map((mentor) => (
            <div
              key={mentor.name}
              className="min-w-[280px] md:min-w-0 bg-white rounded-[18px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300 flex flex-col"
            >
              <img
                src={mentor.image}
                alt={mentor.name}
                className="w-full h-56 object-cover"
              />
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-[#0F172A] mb-1">{mentor.name}</h3>
                  <p className="text-[#2563EB] text-sm font-semibold mb-3">{mentor.role}</p>
                  <p className="text-[#475569] text-sm leading-relaxed mb-4">{mentor.bio}</p>
                </div>
                <p className="text-xs text-slate-400 font-medium border-t border-slate-100 pt-3">
                  Teaches: <span className="text-slate-600 font-semibold">{mentor.teaches}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}