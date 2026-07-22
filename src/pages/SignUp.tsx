import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, User, Mail, Lock, Phone, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { registerUser } from "../services/auth.service";
import { useAuth } from "../context/AuthContext";
import { images } from "../data/content";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser({ name, email, password, phone: phone || undefined });
      login(data.token);
      toast.success("Account created! Welcome to EduReach.");
      navigate("/");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-tr from-slate-100 via-slate-50 to-[#2563EB]/10">
      {/* Form Left Column */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <Link to="/" className="flex items-center gap-1.5 text-slate-500 hover:text-[#2563EB] transition-colors duration-200 font-semibold text-sm">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <Link to="/login" className="text-xs bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB] hover:text-white px-4 py-2 rounded-xl font-bold transition-all duration-200">
              Login
            </Link>
          </div>

          <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
          <p className="text-slate-500 mb-8 text-sm">Join EduReach for unlimited access to AI chat & counseling calls</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 placeholder-slate-500 rounded-xl focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] text-slate-800 text-sm transition-all duration-200 bg-slate-50/30" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 placeholder-slate-500 rounded-xl focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] text-slate-800 text-sm transition-all duration-200 bg-slate-50/30" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters"
                  className="w-full pl-11 pr-11 py-3 border border-slate-200 placeholder-slate-500 rounded-xl focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] text-slate-800 text-sm transition-all duration-200 bg-slate-50/30" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors duration-200 focus:outline-none cursor-pointer">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number (optional)</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91-9876543210"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 placeholder-slate-500 rounded-xl focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] text-slate-800 text-sm transition-all duration-200 bg-slate-50/30" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E3A8A] text-white py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer h-12 mt-4">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-[#2563EB] font-bold hover:underline">Login</Link>
          </p>
        </div>
      </div>

      {/* Decorative Right Column */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img src={images.moreStudents} alt="Students" className="w-full h-full object-cover transform scale-105 hover:scale-100 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/90 to-[#7C3AED]/90 flex items-center justify-center p-12">
          <div className="text-center text-white max-w-md animate-fade-in">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20 shadow-lg">
              <GraduationCap className="w-12 h-12 text-[#06B6D4]" />
            </div>
            <h2 className="font-heading text-4xl font-bold mb-4 tracking-tight">Join EduReach</h2>
            <p className="text-white/90 text-lg leading-relaxed font-light">
              92% placement rate · Top MNC recruiters · 25-acre modern campus. Start your journey with us today.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}