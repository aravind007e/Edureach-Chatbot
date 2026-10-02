import { Link } from "react-router-dom";
import { X, GraduationCap } from "lucide-react";

interface SignupPopupProps {
  show: boolean;
  onClose: () => void;
}

export default function SignupPopup({ show, onClose }: SignupPopupProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-[24px] shadow-2xl max-w-md w-full p-8 relative border border-slate-100">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 transition-colors duration-200 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-[#2563EB]/10 rounded-[18px] flex items-center justify-center mx-auto border border-[#2563EB]/20">
            <GraduationCap className="w-7 h-7 text-[#2563EB]" />
          </div>
          <h3 className="font-heading text-2xl font-bold text-[#0F172A]">Unlock Full Access</h3>
          <p className="text-[#475569] text-sm leading-relaxed">
            Sign up to explore our mentors, campus life, placements, and get AI-powered counseling.
          </p>
          <div className="pt-2">
            <Link to="/signup" onClick={onClose}
              className="block w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-3.5 rounded-[14px] font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 text-center cursor-pointer">
              Create Free Account
            </Link>
          </div>
          <p className="text-sm text-[#475569] font-medium">
            Already have an account?{" "}
            <Link to="/login" onClick={onClose} className="text-[#2563EB] font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}