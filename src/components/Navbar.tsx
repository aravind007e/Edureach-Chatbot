import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, GraduationCap, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { navLinks } from "../data/content";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { chatOpen, setChatOpen } = useChat();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
    setMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm text-[#0F172A] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 flex items-center justify-center border border-[#2563EB]/20 group-hover:bg-[#2563EB] transition-all duration-300">
            <GraduationCap className="w-5 h-5 text-[#2563EB] group-hover:text-white transition-all duration-300" />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight text-[#0F172A]">EduReach</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href}
              className="text-[#475569] hover:text-[#2563EB] transition-colors duration-200 text-[15px] font-semibold relative group py-2">
              {link.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#2563EB] transition-all duration-200 group-hover:w-full" />
            </a>
          ))}
        </div>

        {/* Desktop auth & AI assistant */}
        <div className="hidden md:flex items-center gap-4">
          <button onClick={() => setChatOpen(!chatOpen)}
            className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-[#2563EB]/10 to-[#7C3AED]/10 hover:from-[#2563EB]/15 hover:to-[#7C3AED]/15 text-[#2563EB] hover:text-[#1D4ED8] border border-[#2563EB]/25 px-4 py-2 rounded-[14px] font-bold transition-all duration-200 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#2563EB]" /> AI Assistant
          </button>
          
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-[#475569]">Hi, {user.name.split(" ")[0]}</span>
              <button onClick={handleLogout}
                className="flex items-center gap-2 text-sm bg-slate-50 hover:bg-slate-100 text-[#475569] px-4 py-2 rounded-[14px] border border-slate-200 transition-colors duration-200 cursor-pointer font-semibold">
                <LogOut className="w-4 h-4 text-slate-400" /> Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm text-[#475569] font-semibold hover:text-[#2563EB] transition-colors duration-200 px-3 py-2">Login</Link>
              <Link to="/signup" className="text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-[14px] font-semibold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer">Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-[#475569] hover:text-[#0F172A] p-1.5 rounded-lg focus:outline-none cursor-pointer">
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-6 space-y-4 shadow-lg">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}
              className="block text-[#475569] hover:text-[#2563EB] text-base font-semibold py-1.5 transition-colors duration-200">{link.label}</a>
          ))}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <button onClick={() => { setChatOpen(!chatOpen); setMenuOpen(false); }}
              className="flex w-full items-center justify-center gap-2 text-sm bg-gradient-to-r from-[#2563EB]/10 to-[#7C3AED]/10 text-[#2563EB] py-3 rounded-[14px] border border-[#2563EB]/25 cursor-pointer font-bold"
            >
              <Sparkles className="w-4 h-4" /> AI Assistant
            </button>
            
            {user ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#475569]">Hi, {user.name}</p>
                <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 text-sm bg-slate-50 hover:bg-slate-100 text-[#475569] py-3 rounded-[14px] border border-slate-200 cursor-pointer font-semibold">
                  <LogOut className="w-4 h-4 text-slate-400" /> Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="text-center text-[#475569] hover:text-[#2563EB] font-semibold py-2">Login</Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)} className="text-center bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-3 rounded-[14px] font-semibold shadow-md">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}