import { images, siteConfig } from "../data/content";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section id="hero" className="relative bg-[#F8FAFC] py-20 lg:py-28 overflow-hidden min-h-[600px] flex items-center border-b border-slate-100">
      {/* Background soft gradients */}
      <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-gradient-to-l from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Heading and Info */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 bg-[#2563EB]/10 text-[#2563EB] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider w-fit">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{siteConfig.established} · Hyderabad</span>
            </div>
            
            <h1 className="font-heading text-[42px] sm:text-[54px] lg:text-[64px] font-[800] leading-[1.1] text-[#0F172A] tracking-[-2px] animate-fade-in">
              Welcome to <br className="hidden sm:block" />
              <span className="text-[#2563EB]">{siteConfig.name} College</span>
            </h1>
            
            <p className="text-[#475569] text-base sm:text-lg lg:text-[18px] leading-[1.8] max-w-xl font-normal">
              {siteConfig.tagline}. Premier engineering institution with a 92% placement rate
              and official partnerships with Google, Microsoft & Amazon.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <a href="#courses"
                className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-7 py-3.5 rounded-[14px] font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer">
                <span>Explore Programs</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#about"
                className="inline-flex items-center justify-center bg-white border border-[#E2E8F0] hover:border-[#2563EB] text-[#475569] hover:text-[#2563EB] px-7 py-3.5 rounded-[14px] font-semibold text-sm transition-all duration-200 cursor-pointer">
                Learn More
              </a>
            </div>

            {/* Quick Stats widget */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200 max-w-lg">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">92%</p>
                <p className="text-xs sm:text-sm text-[#475569] font-semibold">Placement Rate</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">₹42L</p>
                <p className="text-xs sm:text-sm text-[#475569] font-semibold">Max Package</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">150+</p>
                <p className="text-xs sm:text-sm text-[#475569] font-semibold">Recruiters Visit</p>
              </div>
            </div>
          </div>
          
          {/* Right Column: Campus Image Card */}
          <div className="lg:col-span-5 relative w-full flex justify-center">
            <div className="relative w-full max-w-[420px] aspect-[4/5] rounded-[24px] overflow-hidden shadow-2xl border-4 border-white transform hover:scale-[1.02] hover:-rotate-1 transition-all duration-300">
              <img src={images.hero} alt="EduReach Campus" className="w-full h-full object-cover" />
              
              {/* Floating glassmorphic info badges */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/85 backdrop-blur-md p-5 rounded-[18px] border border-white/20 shadow-lg">
                <p className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider mb-1">Admissions open</p>
                <h4 className="font-heading font-bold text-base text-[#0F172A] leading-snug">Shape your tech career with EduReach AI guidance.</h4>
              </div>
            </div>

            {/* Decorative details */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#7C3AED]/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#06B6D4]/10 rounded-full blur-2xl" />
          </div>

        </div>
      </div>
    </section>
  );
}