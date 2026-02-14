import React, { useMemo, useState } from 'react';
import { ReflectionEntry } from '../types';
import { Home, Calendar, Brain, ChevronDown, ChevronUp, Trash2, Tag, Target, CheckSquare, Square, Search, Download, ClipboardCheck, FileText } from 'lucide-react';

interface DashboardProps {
  entries: ReflectionEntry[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onToggleAction: (id: string) => void;
}

interface DetailBlockProps {
  label: string;
  text: string;
  icon: string;
  highlightColor?: string;
}

const DetailBlock: React.FC<DetailBlockProps> = ({ label, text, icon, highlightColor }) => (
  <div className={`p-4 md:p-5 rounded-2xl border ${highlightColor || 'bg-white border-slate-100'} shadow-sm`}>
    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 md:mb-3 flex items-center gap-2">
      <span className="text-lg">{icon}</span> {label}
    </h4>
    <p className="text-slate-700 leading-relaxed text-sm md:text-base whitespace-pre-line" dir="auto">{text}</p>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ entries, onBack, onDelete, onToggleAction }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter entries based on search
  const filteredEntries = useMemo(() => {
    if (!searchTerm) return entries;
    const lower = searchTerm.toLowerCase();
    return entries.filter(e => 
      e.situation.toLowerCase().includes(lower) ||
      e.tags.some(t => t.toLowerCase().includes(lower)) ||
      e.cause.toLowerCase().includes(lower) ||
      e.learning.toLowerCase().includes(lower)
    );
  }, [entries, searchTerm]);

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `reflect_surg_portfolio_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-20">
      <div className="max-w-7xl mx-auto flex flex-col min-h-[90vh]">
        
        {/* Navbar */}
        <nav className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-12">
          <div>
             <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">Clinical Portfolio</h1>
             <p className="text-slate-500 text-sm md:text-base">Evidence-based competency tracking.</p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-teal-50 text-teal-700 border border-teal-200 rounded-full hover:bg-teal-100 transition-all font-medium text-xs md:text-sm"
              title="Download Portfolio JSON"
            >
              <Download size={14} className="md:w-4 md:h-4" />
              <span className="inline">Export</span>
            </button>
            <button 
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600 transition-all shadow-sm hover:shadow-md font-medium text-xs md:text-sm"
            >
              <Home size={14} className="md:w-4 md:h-4" />
              <span>Home</span>
            </button>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 flex-1">
          
          {/* Main Content: List & Details (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search cases, tags, or lessons..." 
                  className="w-full pl-12 pr-4 py-3 md:py-4 bg-white border border-slate-200 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none shadow-sm text-slate-700 placeholder:text-slate-400 text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Action Items Tracker (Top) */}
            {entries.length > 0 && (
                <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Target size={16} className="text-teal-600"/> Pending Clinical Actions
                    </h3>
                    <div className="space-y-3">
                        {entries.filter(e => !e.actionTaken).slice(0, 3).map(entry => (
                            <div key={entry.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-teal-200 transition-colors">
                                <button onClick={() => onToggleAction(entry.id)} className="mt-1 text-slate-400 hover:text-teal-600 transition-colors shrink-0">
                                    <Square size={18} />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className="text-slate-800 text-sm font-medium line-clamp-2" dir="auto">{entry.plan}</p>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 truncate">
                                      Link: {entry.situation.substring(0, 40)}...
                                    </p>
                                </div>
                            </div>
                        ))}
                        {entries.filter(e => !e.actionTaken).length === 0 && (
                            <div className="flex items-center gap-2 text-slate-400 text-sm italic p-2">
                              <CheckSquare size={16} /> All actions completed. Excellent work.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Entries List */}
            <div className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <h3 className="text-lg md:text-xl font-serif font-bold text-slate-800">Case Logs</h3>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  {filteredEntries.length} {filteredEntries.length === 1 ? 'Entry' : 'Entries'}
                </span>
              </div>
              
              {filteredEntries.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed animate-fade-in-up">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">
                    {entries.length === 0 ? "Portfolio is empty" : "No matches found"}
                  </h3>
                  <p className="text-slate-500 mt-1 max-w-xs mx-auto text-sm">
                    {entries.length === 0 ? "Start logging your clinical experiences to generate analytics." : "Try adjusting your search terms."}
                  </p>
                  {entries.length === 0 && (
                    <button onClick={onBack} className="mt-6 text-teal-600 font-semibold hover:text-teal-700 text-sm uppercase tracking-wide">Create First Entry</button>
                  )}
                </div>
              ) : (
                filteredEntries.map((entry, idx) => {
                  const isExpanded = expandedId === entry.id;

                  return (
                    <div 
                      key={entry.id} 
                      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-md animate-fade-in-up"
                      style={{ animationDelay: `${Math.min(idx * 0.05, 0.5)}s` }}
                    >
                      <div 
                        onClick={() => toggleExpand(entry.id)}
                        className="p-4 md:p-5 flex items-center justify-between cursor-pointer group active:bg-slate-50"
                      >
                        <div className="flex items-center gap-3 md:gap-5 min-w-0 flex-1">
                          {/* Status Indicator */}
                          <div className={`w-1 md:w-1.5 h-10 md:h-12 rounded-full flex-shrink-0 ${entry.actionTaken ? 'bg-teal-500' : 'bg-amber-400'}`}></div>
                          
                          <div className="overflow-hidden flex-1">
                            <h3 className="font-semibold text-slate-800 text-base md:text-lg truncate group-hover:text-teal-700 transition-colors pr-2 mb-1" dir="auto">
                              {entry.situation}
                            </h3>
                            <div className="flex items-center gap-3 text-slate-400 text-xs md:text-sm">
                              <span className="flex items-center gap-1 min-w-fit shrink-0"><Calendar size={12} className="md:w-3.5 md:h-3.5" /> {new Date(entry.date).toLocaleDateString()}</span>
                              {entry.tags.length > 0 && (
                                  <span className="flex items-center gap-1 truncate"><Tag size={12} className="md:w-3.5 md:h-3.5"/> {entry.tags.join(', ')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pl-2">
                            {isExpanded ? <ChevronUp className="text-slate-300" /> : <ChevronDown className="text-slate-300" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 md:p-8 border-t border-slate-50 bg-slate-50/50">
                          
                          {/* Formal AI Report Display */}
                          {entry.aiFeedback && (
                            <div className="mb-6 md:mb-8 p-0 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <ClipboardCheck size={16} className="text-slate-500"/>
                                    <h4 className="text-xs md:text-sm font-bold text-slate-800 uppercase tracking-wide">
                                      Clinical Reflection Report
                                    </h4>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <span className="text-[10px] md:text-xs font-serif font-bold text-slate-400 tracking-widest">SCOME | BUSSS</span>
                                  </div>
                                </div>
                                <div className="p-4 md:p-6 space-y-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Situation</p>
                                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100" dir="auto">{entry.aiFeedback.situationSummary}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Analysis</p>
                                        <p className="text-sm text-slate-700 leading-relaxed" dir="auto">{entry.aiFeedback.clinicalAnalysis}</p>
                                      </div>
                                  </div>
                                  <div>
                                     <p className="text-xs font-bold text-slate-400 uppercase mb-2">Root Cause</p>
                                     <p className="text-sm text-slate-700 leading-relaxed" dir="auto">{entry.aiFeedback.rootCause}</p>
                                  </div>
                                  <div>
                                      <p className="text-xs font-bold text-slate-400 uppercase mb-2">Professional Action Plan</p>
                                      <ul className="space-y-1">
                                          {entry.aiFeedback.actionPlan?.map((step, i) => (
                                              <li key={i} className="text-sm text-slate-700 flex items-start gap-2" dir="auto">
                                                <span className="font-bold text-slate-400">{i+1}.</span> {step}
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                                </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <DetailBlock label="The Event" text={entry.situation} icon="📍" />
                            <DetailBlock label="Emotions" text={entry.emotion} icon="💭" />
                            <DetailBlock label="Analysis" text={entry.cause} icon="🔍" highlightColor="bg-amber-50/50 border-amber-100" />
                            <DetailBlock label="Lessons" text={entry.learning} icon="💡" highlightColor="bg-blue-50/50 border-blue-100" />
                            
                            <div className="md:col-span-2 bg-white p-4 md:p-5 rounded-xl border border-teal-100 shadow-sm">
                                <h4 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Target size={14} /> Future Plan
                                </h4>
                                <div className="flex items-start gap-3">
                                    <button 
                                        onClick={() => onToggleAction(entry.id)} 
                                        className={`mt-1 transition-colors ${entry.actionTaken ? 'text-teal-600' : 'text-slate-300 hover:text-teal-600'}`}
                                        title={entry.actionTaken ? "Mark as pending" : "Mark as done"}
                                    >
                                        {entry.actionTaken ? <CheckSquare size={20} className="md:w-6 md:h-6" /> : <Square size={20} className="md:w-6 md:h-6" />}
                                    </button>
                                    <p className={`text-sm md:text-base leading-relaxed ${entry.actionTaken ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-800'}`} dir="auto">
                                        {entry.plan}
                                    </p>
                                </div>
                            </div>

                            <div className="md:col-span-2 flex justify-end pt-4 border-t border-slate-200/50 mt-2">
                                <button 
                                    onClick={() => onDelete(entry.id)}
                                    className="text-slate-400 hover:text-red-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors py-2 px-3 rounded-lg hover:bg-red-50"
                                >
                                    <Trash2 size={14} /> Delete Entry
                                </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar (4 Cols) */}
          <div className="lg:col-span-4 space-y-6 flex flex-col">
             {/* Institutional Branding - Hidden on mobile, visible on LG */}
             <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-200 shadow-sm hidden lg:flex flex-col items-center justify-center text-center h-fit">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Partners</p>
                 <div className="flex flex-col items-center justify-center gap-2">
                    <h2 className="text-2xl font-serif font-bold text-slate-700 tracking-widest">
                       SCOME <span className="text-teal-500">|</span> BUSSS
                    </h2>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-200 w-full">
                     <p className="text-slate-500 text-xs font-medium">Empowering medical professionals through structured reflection.</p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};