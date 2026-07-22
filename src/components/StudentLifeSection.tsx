import { campusFeatures } from "../data/content";
import { Sparkles } from "lucide-react";

export default function StudentLifeSection() {
  return (
    <section id="campus" className="py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-3">
          <p className="text-[#2563EB] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#2563EB]" /> BEYOND THE CLASSROOM
          </p>
          <h2 className="font-heading text-[30px] md:text-[40px] font-[700] text-[#0F172A] tracking-tight">
            Campus & Student Life
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {campusFeatures.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-[18px] overflow-hidden h-72 cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* Image - zooms on hover */}
              <img
                src={feature.image}
                alt={feature.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Glassmorphic dark overlay at the bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end">
                <div className="w-full p-6 space-y-2">
                  <span className="text-[10px] font-bold text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/20 px-2 py-0.5 rounded uppercase tracking-wider">
                    Campus Life
                  </span>
                  <h3 className="text-white font-bold text-xl tracking-wide">{feature.title}</h3>
                  {/* Description slides up on hover */}
                  <p className="text-slate-200 text-sm leading-relaxed max-h-0 overflow-hidden group-hover:max-h-20 transition-all duration-500 ease-in-out font-medium">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}