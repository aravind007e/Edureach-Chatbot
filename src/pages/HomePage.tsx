import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import SignupPopup from "../components/SignupPopup";
import CallPopup from "../components/CallPopup";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import AchievementsSection from "../components/AchievementsSection";
import CoursesSection from "../components/CoursesSection";
import QuotesSection from "../components/QuotesSection";
import MentorsSection from "../components/MentorsSection";
import StudentLifeSection from "../components/StudentLifeSection";
import EventsGallery from "../components/EventsGallery";
import CounselorCTA from "../components/CounselorCTA";
import HiringStatsSection from "../components/HiringStatsSection";
import Footer from "../components/Footer";  
// ... section imports

export default function HomePage() {
  const { user } = useAuth();
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [showCallPopup, setShowCallPopup] = useState(false);

  // Scroll trigger — show signup popup when visitor reaches Mentors section
  const handleReachMentors = () => {
    if (!user && !sessionStorage.getItem("popupShown")) {
      setShowSignupPopup(true);
      sessionStorage.setItem("popupShown", "true");
    }
  };

  return (
    <div>
      {/* Visible to everyone */}
      <HeroSection />
      <AboutSection />
      <AchievementsSection />
      <CoursesSection />
      <QuotesSection />
      <MentorsSection onReachMentors={handleReachMentors} />

      {/* Content below Mentors — GATED */}
      {user ? (
        <>
          <StudentLifeSection />
          <EventsGallery />
          <CounselorCTA onOpenCall={() => setShowCallPopup(true)} />
          <HiringStatsSection />
          <Footer />
        </>
      ) : (
        <section className="py-24 bg-[#F8FAFC] text-center border-t border-slate-100">
          <div className="max-w-2xl mx-auto px-6 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#2563EB]/10 flex items-center justify-center mx-auto text-[#2563EB] border border-[#2563EB]/25">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="font-heading text-[30px] md:text-[40px] font-[700] text-[#0F172A] tracking-tight">Unlock Full Access</h2>
            <p className="text-[#475569] text-base md:text-lg leading-[1.8] font-normal max-w-xl mx-auto">
              Sign up or log in to explore campus facilities, event highlights, placement stats dashboard, and talk to Ava, our outbound AI Counselor.
            </p>
            <div className="pt-2">
              <button onClick={() => setShowSignupPopup(true)}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-4 rounded-[14px] font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-95">
                Sign Up to Unlock
              </button>
            </div>
          </div>
          <div className="mt-16">
            <Footer />
          </div>
        </section>
      )}

      <SignupPopup show={showSignupPopup} onClose={() => setShowSignupPopup(false)} />
      <CallPopup open={showCallPopup} onClose={() => setShowCallPopup(false)} />
    </div>
  );
}