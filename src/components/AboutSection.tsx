import { aboutContent, images } from "../data/content";
import { Sparkles } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left - Images */}
          <div className="relative">
            <div className="overflow-hidden rounded-2xl shadow-xl aspect-video md:aspect-[4/3] border border-slate-100">
              <img
                src={images.collegeClassroom}
                alt="Classroom"
                className="w-full h-full object-cover transform hover:scale-102 transition-transform duration-500"
              />
            </div>
            {/* Small overlay image */}
            <div className="absolute -bottom-8 -right-8 w-44 h-44 rounded-2xl overflow-hidden shadow-2xl border-4 border-white hidden lg:block">
              <img
                src={images.tech1}
                alt="Technology"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right - Content */}
          <div className="space-y-6">
            <p className="text-[#2563EB] font-bold text-xs uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#2563EB]" /> {aboutContent.subtitle}
            </p>
            <h2 className="font-heading text-[30px] md:text-[40px] font-[700] text-[#0F172A] leading-tight tracking-tight">
              {aboutContent.title}
            </h2>
            <p className="text-[#475569] text-[16px] leading-[1.8] font-normal">
              {aboutContent.description}
            </p>

            {/* Stat grid */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {aboutContent.highlights.map((item) => (
                <div
                  key={item.label}
                  className="bg-[#F8FAFC] border border-slate-100 rounded-[14px] p-5 text-center hover:shadow-md hover:scale-[1.02] transition-all duration-300"
                >
                  <p className="text-3xl font-extrabold text-[#2563EB] mb-1">{item.value}</p>
                  <p className="text-xs sm:text-sm text-[#475569] font-medium leading-normal">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}