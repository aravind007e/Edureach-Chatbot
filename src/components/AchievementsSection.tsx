import { achievementsContent } from "../data/content";

export default function AchievementsSection() {
  return (
    <section className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] py-16 relative overflow-hidden">
      {/* Soft background glow circles */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {achievementsContent.stats.map((stat) => (
            <div key={stat.label} className="text-center space-y-2">
              <p className="text-4xl sm:text-5xl font-extrabold text-white font-heading tracking-tight">
                {stat.value}
              </p>
              <p className="text-white/80 text-xs sm:text-sm font-semibold uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}