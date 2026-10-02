import { coursesContent, images } from "../data/content";
import { BookOpen, Users, Sparkles } from "lucide-react";

export default function CoursesSection() {
  return (
    <section id="courses" className="py-24 bg-[#F8FAFC] border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 space-y-3">
          <p className="text-[#2563EB] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#2563EB]" /> WORLD-CLASS EDUCATION
          </p>
          <h2 className="font-heading text-[30px] md:text-[40px] font-[700] text-[#0F172A] tracking-tight">
            Programs Offered
          </h2>
        </div>

        {/* B.Tech grid */}
        <h3 className="font-heading text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[#2563EB] rounded-full inline-block" />
          B.Tech Programs (4 Years)
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {coursesContent.btech.map((course) => (
            <div
              key={course.name}
              className="bg-white rounded-[18px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] flex-shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[22px] font-semibold text-[#0F172A] leading-tight mb-2">{course.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-[#475569] font-medium">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-400" /> {course.seats} seats
                    </span>
                    <span className="text-[#2563EB] font-semibold bg-[#2563EB]/5 px-2 py-0.5 rounded-lg">{course.avg}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* M.Tech & MBA */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* M.Tech */}
          <div className="bg-white rounded-[18px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <img src={images.tech2} alt="Tech" className="w-16 h-16 rounded-[14px] object-cover" />
              <h3 className="font-heading text-[22px] font-semibold text-[#0F172A]">M.Tech Programs</h3>
            </div>
            <div className="space-y-1">
              {coursesContent.mtech.map((course) => (
                <div key={course.name} className="flex justify-between items-center text-sm py-3 border-b border-slate-100 last:border-0 font-medium">
                  <span className="text-[#475569]">{course.name}</span>
                  <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg text-xs">{course.seats} seats</span>
                </div>
              ))}
            </div>
          </div>

          {/* MBA */}
          <div className="bg-white rounded-[18px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <img src={images.tech3} alt="MBA" className="w-16 h-16 rounded-[14px] object-cover" />
              <h3 className="font-heading text-[22px] font-semibold text-[#0F172A]">MBA Program</h3>
            </div>
            <p className="text-[#475569] leading-relaxed mb-4">{coursesContent.mba.name}</p>
            <div className="flex items-center gap-4 text-sm font-semibold mb-3">
              <span className="text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-lg text-xs">{coursesContent.mba.seats} seats</span>
              <span className="text-[#2563EB] font-bold bg-[#2563EB]/5 px-2.5 py-0.5 rounded-lg text-xs">{coursesContent.mba.avg}</span>
            </div>
            <p className="text-[#475569] text-sm leading-relaxed">
              Specializations in Finance, Marketing, HR, and IT
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}