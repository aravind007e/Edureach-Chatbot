import { eventsGallery } from "../data/content";
import { Sparkles } from "lucide-react";

const EventsGallery = () => (
  <section className="py-24 bg-white border-b border-slate-100">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16 space-y-3">
        <p className="text-[#2563EB] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#2563EB]" /> LIFE AT EDUREACH
        </p>
        <h2 className="font-heading text-[30px] md:text-[40px] font-[700] text-[#0F172A] tracking-tight">Events & Highlights</h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {eventsGallery.map((item: { title: string; image: string }) => (
          <div key={item.title} className="group relative overflow-hidden rounded-[18px] aspect-square shadow-md hover:shadow-xl transition-all duration-300">
            <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
              <p className="text-white text-sm font-semibold p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                {item.title}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default EventsGallery;