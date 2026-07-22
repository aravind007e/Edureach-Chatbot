import { topRecruiters, deptPlacements, images } from "../data/content";
import { TrendingUp, Award, Building, Sparkles } from "lucide-react";

export default function HiringStatsSection() {
  return (
    <section id="placements" className="py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16 space-y-3">
          <p className="text-[#2563EB] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#2563EB]" /> CAREER ACCELERATOR
          </p>
          <h2 className="font-heading text-[30px] md:text-[40px] font-[700] text-[#0F172A] tracking-tight">
            Placement Highlights 2023–24
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          
          {/* Chart Widget */}
          <div className="bg-white rounded-[18px] p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-[#0F172A]">Average Package by Department</h3>
                  <p className="text-xs text-[#475569] font-medium">Annual placement CTC report</p>
                </div>
              </div>

              <div className="space-y-6">
                {deptPlacements.map((item) => (
                  <div key={item.dept} className="space-y-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-[#0F172A]">{item.dept}</span>
                      <span className="text-[#2563EB]">{item.avg}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Quick footnote */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-[#475569] font-medium">
              <Award className="w-4 h-4 text-emerald-500" />
              <span>Highest packages offered in CSE and IT departments.</span>
            </div>
          </div>

          {/* Image Grid & Recruiters List */}
          <div className="space-y-8">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-[18px] overflow-hidden h-28 border border-slate-100 shadow-sm">
                <img src={images.recruter1} alt="Fest" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="rounded-[18px] overflow-hidden h-28 border border-slate-100 shadow-sm">
                <img src={images.recruter2} alt="Event" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="rounded-[18px] overflow-hidden h-28 border border-slate-100 shadow-sm">
                <img src={images.moreStudents} alt="Students" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
            </div>

            {/* Recruiters Card */}
            <div className="bg-white rounded-[18px] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED]">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-[#0F172A]">Top Recruiters</h3>
                  <p className="text-xs text-[#475569] font-medium">Global recruiters visiting campus</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {topRecruiters.map((company) => (
                  <span
                    key={company}
                    className="px-4 py-2 bg-slate-50 text-[#475569] font-semibold rounded-full text-xs border border-slate-150 hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-[#2563EB]/5 transition-all duration-200 cursor-pointer"
                  >
                    {company}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}