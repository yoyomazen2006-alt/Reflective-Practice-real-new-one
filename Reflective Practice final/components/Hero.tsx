import React from 'react';
import { Activity, ArrowRight, Brain, ChevronRight, Sparkles } from 'lucide-react';

interface HeroProps {
  onStart: () => void;
  onDashboard: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStart, onDashboard }) => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950 text-white">
      {/* Background Ambience - Adjusted for Mobile */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-teal-600/20 rounded-full blur-[80px] md:blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-indigo-600/20 rounded-full blur-[80px] md:blur-[120px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 md:px-6 md:py-16">
        
        {/* Main Content Card */}
        <div className="max-w-6xl w-full animate-fade-in-up flex flex-col items-center">
          <div className="text-center mb-8 md:mb-10 mt-4 md:mt-0">
            <span className="inline-block py-1 px-3 md:py-1.5 md:px-5 rounded-full bg-teal-950/50 border border-teal-800/50 text-teal-400 text-[9px] md:text-[10px] font-bold tracking-[0.2em] md:tracking-[0.3em] uppercase mb-6 md:mb-8 shadow-xl shadow-teal-900/10 backdrop-blur-md">
              AI-Powered Clinical Documentation
            </span>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif mb-6 md:mb-8 leading-[1.1] tracking-tight text-slate-100 drop-shadow-xl">
              <span className="font-medium block text-2xl md:text-5xl md:inline mb-2 md:mb-0 text-slate-300">Turn Clinical Experience into</span>
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-emerald-100 to-teal-500 drop-shadow-sm">
                Medical Mastery
              </span>
            </h1>
            
            <div className="space-y-3 text-base md:text-2xl font-light max-w-3xl mx-auto leading-relaxed tracking-wide px-2">
              <p className="text-slate-300">
                Don't just log your cases. Analyze them with an <span className="text-teal-400 font-medium whitespace-nowrap">AI Senior Mentor</span> and build a portfolio that stands out.
              </p>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12 md:mb-16 w-full max-w-4xl delay-100 animate-fade-in-up px-2 md:px-0">
            <button 
              onClick={onStart}
              className="group relative overflow-hidden p-6 md:p-10 rounded-2xl md:rounded-3xl bg-gradient-to-br from-teal-600 to-teal-900 hover:from-teal-500 hover:to-teal-800 transition-all shadow-xl md:shadow-2xl hover:shadow-teal-900/50 text-left border border-teal-500/30 active:scale-[0.98] duration-200"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Activity size={80} className="md:w-[120px] md:h-[120px]" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl md:text-3xl font-bold mb-2 md:mb-3 flex items-center gap-2 md:gap-3 text-white">
                  Log New Case <ArrowRight size={20} className="md:w-7 md:h-7 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-teal-100 text-sm md:text-base opacity-90 font-medium leading-relaxed pr-8 md:pr-0">
                  Document a clinical event using the 5-step structured framework.
                </p>
              </div>
            </button>

            <button 
              onClick={onDashboard}
              className="group relative overflow-hidden p-6 md:p-10 rounded-2xl md:rounded-3xl glass-panel-dark hover:bg-white/10 transition-all text-left shadow-xl md:shadow-2xl active:scale-[0.98] duration-200"
            >
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <Brain size={80} className="md:w-[120px] md:h-[120px]" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl md:text-3xl font-bold mb-2 md:mb-3 flex items-center gap-2 md:gap-3 text-slate-100">
                  Portfolio <ChevronRight size={20} className="md:w-7 md:h-7 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed pr-8 md:pr-0">
                  View performance trends, root cause analysis, and insights.
                </p>
              </div>
            </button>
          </div>

          {/* Institutional Hierarchy Section - Professional Redesign */}
          <div className="w-full flex flex-col items-center animate-fade-in-up delay-200 mt-auto border-t border-white/5 pt-8 md:pt-10 pb-6">
            
            {/* Typographic Logos */}
            <div className="mb-3 md:mb-4">
               <h2 className="text-2xl md:text-5xl font-serif font-bold tracking-widest text-white drop-shadow-md">
                  SCOME <span className="text-teal-500 mx-2">|</span> BUSSS
               </h2>
            </div>

            {/* Hierarchy Text */}
            <div className="text-center space-y-2 md:space-y-3">
                <p className="text-xs md:text-base text-slate-400 font-light tracking-widest uppercase">
                  Empowering Future Doctors
                </p>
                
                {/* IFMSA Egypt Affiliation */}
                <div className="flex items-center justify-center gap-3 pt-2 opacity-70 hover:opacity-100 transition-opacity">
                     <span className="h-px w-4 md:w-6 bg-gradient-to-r from-transparent to-teal-500/60"></span>
                     <span className="text-[9px] md:text-xs font-bold tracking-[0.25em] text-teal-400 uppercase">IFMSA Egypt</span>
                     <span className="h-px w-4 md:w-6 bg-gradient-to-l from-transparent to-teal-500/60"></span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};