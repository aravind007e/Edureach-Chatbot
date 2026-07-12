import { useNavigate } from "react-router-dom";
import { images } from "../data/content";
import { PhoneCall } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface CounselorCTAProps {
  onOpenCall: () => void;
}

export default function CounselorCTA({ onOpenCall }: CounselorCTAProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    if (user) {
      onOpenCall();
    } else {
      navigate("/login");
    }
  };

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Image */}
      <img src={images.moreStudents} alt="Students" className="absolute inset-0 w-full h-full object-cover" />
      
      {/* Premium gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#2563EB]/90 to-[#7C3AED]/90" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-6">
        <p className="text-[#06B6D4] font-bold text-xs uppercase tracking-widest">
          Expert Admissions Guidance
        </p>
        <h2 className="font-heading text-3xl md:text-5xl font-[800] text-white leading-tight tracking-tight">
          Need Help Choosing <br className="hidden sm:block" />
          The Right University For You?
        </h2>
        <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
          Get personalized guidance on courses, admissions, fees, scholarships, and career paths with Ava, our AI Counselor.
        </p>
        
        <div className="pt-2">
          <button
            onClick={handleClick}
            className="inline-flex items-center gap-2.5 bg-white text-[#2563EB] hover:bg-slate-50 px-8 py-4 rounded-[14px] font-semibold text-base transition-all duration-300 shadow-xl hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-[#2563EB]" />
            <span>Talk to Ava</span>
          </button>
        </div>
      </div>
    </section>
  );
}