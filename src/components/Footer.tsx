import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";
import { contactInfo } from "../data/content";

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-white pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-7 h-7 text-[#06B6D4]" />
              <span className="font-heading text-xl font-bold tracking-tight">EduReach</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Premier engineering institution established in 2005. AICTE approved, JNTU Hyderabad affiliated.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-base">Quick Links</h4>
            <div className="space-y-2.5 text-sm text-slate-400">
              <a href="#about" className="block hover:text-[#60A5FA] transition-colors duration-200">About Us</a>
              <a href="#courses" className="block hover:text-[#60A5FA] transition-colors duration-200">Programs</a>
              <a href="#mentors" className="block hover:text-[#60A5FA] transition-colors duration-200">Faculty</a>
              <a href="#campus" className="block hover:text-[#60A5FA] transition-colors duration-200">Campus Life</a>
              <a href="#placements" className="block hover:text-[#60A5FA] transition-colors duration-200">Placements</a>
            </div>
          </div>

          {/* Programs */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-base">Programs</h4>
            <div className="space-y-2.5 text-sm text-slate-400">
              <p>B.Tech (6 specializations)</p>
              <p>M.Tech (3 specializations)</p>
              <p>MBA (Finance, Marketing, HR, IT)</p>
              <p className="text-[#06B6D4] font-medium">Admissions open: March 1st</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-base">Contact Us</h4>
            <div className="space-y-3.5 text-sm text-slate-400">
              <p className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#06B6D4] flex-shrink-0" />
                {contactInfo.email}
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#06B6D4] flex-shrink-0" />
                {contactInfo.phone}
              </p>
              <p className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#06B6D4] flex-shrink-0" />
                {contactInfo.address}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-6 text-center text-sm text-slate-500 font-medium">
          © {new Date().getFullYear()} EduReach College, Hyderabad. All rights reserved.
        </div>
      </div>
    </footer>
  );
}