import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Save, X, Activity, Target, Brain, ClipboardCheck, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Stethoscope, Microscope, Globe, Send, MessageSquare } from 'lucide-react';
import { ReflectionEntry, AIResponse, ChatMessage } from '../types';
import { analyzeReflection, chatWithMentor } from '../services/geminiService';

interface ReflectionWizardProps {
  onSave: (entry: ReflectionEntry) => void;
  onCancel: () => void;
  previousEntries: ReflectionEntry[];
}

const DRAFT_KEY = 'reflect_surg_draft_v3';

export const ReflectionWizard: React.FC<ReflectionWizardProps> = ({ onSave, onCancel, previousEntries }) => {
  
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState("");
  const [aiResult, setAiResult] = useState<AIResponse | null>(null);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<Partial<ReflectionEntry>>({
    stressLevel: 5,
    tags: [],
    actionTaken: false
  });
  const [tagInput, setTagInput] = useState("");
  
  // AI Language Preference
  const [language, setLanguage] = useState<'arabic' | 'english'>('arabic');
  
  // Mobile UI State
  const [mobileTab, setMobileTab] = useState<'report' | 'chat'>('report');

  // Auto-Save / Load logic
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.step && parsed.step <= 5) setStep(parsed.step);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, formData }));
  }, [step, formData]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatting, mobileTab]);

  const handleChange = (field: keyof ReflectionEntry, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const currentTags = formData.tags || [];
      if (!currentTags.includes(tagInput.trim())) {
        handleChange('tags', [...currentTags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = formData.tags || [];
    handleChange('tags', currentTags.filter(t => t !== tagToRemove));
  };

  const isStepValid = () => {
    switch(step) {
      case 1: return !!formData.situation && formData.situation.length > 5;
      case 2: return !!formData.emotion && !!formData.stressLevel;
      case 3: return !!formData.cause && formData.cause.length > 5;
      case 4: return !!formData.learning && formData.learning.length > 5;
      case 5: return !!formData.plan && formData.plan.length > 5;
      default: return false;
    }
  };

  const handleAnalyze = async () => {
    if (!isStepValid()) return;
    
    setStatus('analyzing');
    setStep(6); // Move to analysis view
    setErrorMsg("");
    setAiResult(null);
    setChatHistory([]); // Reset chat
    setMobileTab('report'); // Default to report view
    
    const tempEntry: ReflectionEntry = {
      id: "temp",
      date: new Date().toISOString(),
      situation: formData.situation || "",
      emotion: formData.emotion || "",
      cause: formData.cause || "",
      learning: formData.learning || "",
      plan: formData.plan || "",
      stressLevel: formData.stressLevel || 5,
      rootCauseType: "Analysis",
      competency: "Lesson",
      tags: formData.tags || [],
      actionTaken: false
    };

    try {
        // Pass previousEntries for historical context
        const result = await analyzeReflection(tempEntry, language, previousEntries);
        setAiResult(result);
        setStatus('complete');
    } catch (e: any) {
        console.error("Wizard Analysis failed", e);
        setStatus('error');
        setErrorMsg(e.message || "Failed to contact Mentor.");
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !aiResult) return;

    const userMsg: ChatMessage = { role: 'user', content: chatInput, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatting(true);

    try {
      const tempEntry: ReflectionEntry = {
        id: "temp",
        date: new Date().toISOString(),
        situation: formData.situation || "",
        emotion: formData.emotion || "",
        cause: formData.cause || "",
        learning: formData.learning || "",
        plan: formData.plan || "",
        stressLevel: formData.stressLevel || 5,
        rootCauseType: "Analysis",
        competency: "Lesson",
        tags: formData.tags || [],
        actionTaken: false
      };

      const responseText = await chatWithMentor(
        userMsg.content,
        chatHistory,
        tempEntry,
        aiResult,
        language
      );

      const aiMsg: ChatMessage = { role: 'model', content: responseText, timestamp: Date.now() };
      setChatHistory(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'model', content: "Failed to send message. Please try again.", timestamp: Date.now() }]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleFinalSave = () => {
    const entry: ReflectionEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      situation: formData.situation || "",
      emotion: formData.emotion || "",
      cause: formData.cause || "",
      learning: formData.learning || "",
      plan: formData.plan || "",
      stressLevel: formData.stressLevel || 5,
      rootCauseType: "Analysis",
      competency: "Lesson",
      tags: formData.tags || [],
      actionTaken: false,
      aiFeedback: aiResult || undefined,
      chatHistory: chatHistory // Save conversation
    };
    
    localStorage.removeItem(DRAFT_KEY);
    onSave(entry);
  };

  const steps = [
    { title: "The Event", subtitle: "What happened?" },
    { title: "Emotions", subtitle: "Internal State" },
    { title: "Analysis", subtitle: "Root Cause" },
    { title: "Lessons", subtitle: "Key Takeaways" },
    { title: "Future Plan", subtitle: "Action Protocol" }
  ];

  if (step === 6) {
      return (
          <div className="fixed inset-0 md:relative md:inset-auto md:min-h-screen bg-slate-50 flex items-center justify-center p-0 md:p-4 z-50">
              <div className="w-full h-full md:h-[90vh] md:max-w-6xl bg-white md:rounded-xl shadow-2xl overflow-hidden md:border border-slate-100 flex flex-col">
                  
                  {/* HEADER */}
                  <div className="bg-white border-b border-slate-100 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 border border-teal-100 shrink-0">
                          <Stethoscope size={18} className="md:w-5 md:h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <h2 className="text-lg md:text-xl font-serif font-bold text-slate-900 truncate">Clinical Reflection</h2>
                          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wide mt-0.5">
                             <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-teal-500"/> AI Analysis Complete</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3">
                        <button 
                          onClick={handleFinalSave}
                          className="px-4 md:px-6 py-2 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-md transition-all flex items-center gap-2 text-xs md:text-sm uppercase tracking-wide"
                        >
                            <Save size={16} /> <span className="hidden md:inline">Save to Portfolio</span><span className="md:hidden">Save</span>
                        </button>
                        <button onClick={() => setStep(5)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors">
                          <X size={20} />
                        </button>
                      </div>
                  </div>

                  {/* MOBILE SEGMENTED CONTROL */}
                  <div className="md:hidden px-4 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
                      <div className="flex p-1 bg-slate-200/50 rounded-xl">
                          <button 
                            onClick={() => setMobileTab('report')}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 rounded-lg transition-all ${mobileTab === 'report' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                             <ClipboardCheck size={14} /> Analysis
                          </button>
                          <button 
                            onClick={() => setMobileTab('chat')}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 rounded-lg transition-all ${mobileTab === 'chat' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                             <MessageSquare size={14} /> Mentor Chat
                          </button>
                      </div>
                  </div>

                  {/* CONTENT AREA */}
                  <div className="flex-1 flex overflow-hidden relative">
                      
                      {/* LEFT: REPORT (Scrollable) */}
                      <div className={`flex-1 overflow-y-auto bg-slate-50/50 md:border-r border-slate-200 w-full transition-opacity duration-300 ${mobileTab === 'report' ? 'block opacity-100' : 'hidden md:block opacity-0 md:opacity-100'}`}>
                          <div className="p-4 md:p-8 pb-20 md:pb-8">
                              {/* Formal Letterhead */}
                              <div className="flex items-center justify-between mb-6 md:mb-8 pb-4 border-b border-slate-200/60 opacity-90">
                                  <div>
                                    <h3 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest">Confidential Report</h3>
                                    <p className="text-[10px] md:text-xs text-slate-400 mt-1">{new Date().toLocaleDateString()}</p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <h2 className="text-lg md:text-xl font-serif font-bold text-slate-700 tracking-widest">
                                        SCOME <span className="text-teal-600">|</span> BUSSS
                                      </h2>
                                  </div>
                              </div>

                              {aiResult ? (
                                  <div className="space-y-6">
                                    <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-slate-200/60">
                                        <div className="mb-6 border-b border-slate-100 pb-4">
                                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Activity size={14} /> Situation Summary
                                          </h3>
                                          <p className="text-slate-800 leading-relaxed font-serif text-base md:text-lg" dir="auto">
                                            {aiResult.situationSummary}
                                          </p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 mb-6">
                                          <div>
                                              <h3 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Microscope size={14} /> Clinical Analysis
                                              </h3>
                                              <p className="text-sm leading-7 text-slate-600 text-justify whitespace-pre-line" dir="auto">
                                                {aiResult.clinicalAnalysis}
                                              </p>
                                          </div>
                                          <div>
                                              <h3 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Target size={14} /> Root Cause
                                              </h3>
                                              <p className="text-sm leading-7 text-slate-600 text-justify font-medium whitespace-pre-line" dir="auto">
                                                {aiResult.rootCause}
                                              </p>
                                          </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
                                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <ClipboardCheck size={18} className="text-teal-600"/> Remedial Action Plan
                                            </h3>
                                            <ul className="space-y-3">
                                                {(aiResult.actionPlan || []).map((step, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-slate-700 text-sm" dir="auto">
                                                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0 shadow-sm">
                                                            {i+1}
                                                        </span>
                                                        <span className="leading-relaxed font-medium">{step}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    
                                    {/* Mobile Hint */}
                                    <div className="md:hidden text-center p-4 text-xs text-slate-400 italic bg-white rounded-xl border border-slate-100 shadow-sm">
                                        Tap "Mentor Chat" above to ask specific questions.
                                    </div>
                                  </div>
                              ) : (
                                  <div className="h-full flex items-center justify-center min-h-[50vh]">
                                      {status === 'analyzing' && (
                                         <div className="text-center">
                                            <Brain size={48} className="text-teal-500 animate-pulse mx-auto mb-4"/>
                                            <p className="text-slate-500">Consulting Mentor...</p>
                                         </div>
                                      )}
                                      {status === 'error' && (
                                         <div className="text-center text-red-500">
                                            <AlertCircle size={48} className="mx-auto mb-4"/>
                                            <p>{errorMsg}</p>
                                            <button onClick={handleAnalyze} className="mt-4 text-sm underline">Retry</button>
                                         </div>
                                      )}
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* RIGHT: CHAT */}
                      <div className={`w-full md:w-[400px] flex-col bg-white md:border-l border-slate-100 transition-all duration-300 ${mobileTab === 'chat' ? 'flex' : 'hidden md:flex'}`}>
                          <div className="hidden md:flex p-4 border-b border-slate-100 bg-slate-50 items-center gap-2 shrink-0">
                             <MessageSquare size={16} className="text-teal-600"/>
                             <span className="text-sm font-bold text-slate-700 uppercase">Mentor Chat</span>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                              {chatHistory.length === 0 && (
                                <div className="text-center py-10 text-slate-400 text-sm italic">
                                   <p>Have questions about the analysis?</p>
                                   <p>Ask the mentor specifically about this case.</p>
                                </div>
                              )}
                              
                              {chatHistory.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                   <div 
                                     className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-line ${
                                        msg.role === 'user' 
                                          ? 'bg-slate-800 text-white rounded-tr-none' 
                                          : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                                     }`}
                                     dir="auto"
                                   >
                                      {msg.content}
                                   </div>
                                </div>
                              ))}
                              {isChatting && (
                                 <div className="flex justify-start">
                                    <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                                       <div className="flex gap-1">
                                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                                       </div>
                                    </div>
                                 </div>
                              )}
                              <div ref={chatEndRef} />
                          </div>

                          <div className="p-4 border-t border-slate-100 bg-white shrink-0 safe-pb-4">
                             <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500/20 outline-none"
                                  placeholder="Ask a follow-up..."
                                  value={chatInput}
                                  onChange={(e) => setChatInput(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                  dir="auto"
                                  disabled={isChatting}
                                />
                                <button 
                                  onClick={handleSendMessage}
                                  disabled={!chatInput.trim() || isChatting}
                                  className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white p-3 rounded-xl transition-colors shadow-lg shadow-teal-600/20 shrink-0"
                                >
                                   <Send size={18} />
                                </button>
                             </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-0 md:p-8">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 md:gap-6 min-h-[100vh] md:min-h-[600px] bg-white md:bg-transparent">
        
        {/* Sidebar / Topbar */}
        <div className="md:col-span-4 bg-white md:rounded-3xl p-6 md:p-8 shadow-sm md:shadow-xl border-b md:border border-slate-100 flex flex-col justify-between relative overflow-hidden shrink-0 z-20">
          <div className="absolute top-0 left-0 w-full h-1 md:h-2 bg-gradient-to-r from-teal-400 to-blue-500"></div>
          
          <div>
            <div className="mb-4 md:mb-8 flex justify-between items-center md:block">
              <div>
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Step {step} of 5</span>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-800 mt-1 md:mt-2">{steps[step-1].title}</h2>
              </div>
              <button onClick={onCancel} className="md:hidden text-slate-400 p-2">
                 <X size={20} />
              </button>
            </div>

            {/* Steps Visualizer - Compact on mobile */}
            <div className="flex md:flex-col gap-2 md:gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide mask-fade-right md:mask-none">
              {steps.map((s, idx) => {
                const stepNum = idx + 1;
                const isActive = step === stepNum;
                const isCompleted = step > stepNum;
                
                return (
                  <div key={idx} className={`flex items-center gap-4 transition-all duration-300 shrink-0 ${isActive ? 'translate-x-0 md:translate-x-2' : ''}`}>
                    <div className={`
                      w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold border-2 transition-colors
                      ${isActive ? 'border-teal-500 text-teal-600 bg-teal-50' : 
                        isCompleted ? 'border-teal-200 bg-teal-500 text-white border-transparent' : 'border-slate-200 text-slate-400'}
                    `}>
                      {isCompleted ? <CheckCircle2 size={14} className="md:w-4 md:h-4" /> : stepNum}
                    </div>
                    <span className={`text-sm font-medium hidden md:inline ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                      {s.title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-4 md:mt-8 pt-4 md:pt-8 border-t border-slate-100 hidden md:block">
             <button onClick={onCancel} className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-2 transition-colors mb-6">
               <X size={16} /> Discard Draft
             </button>

             {/* PARTNER LOGOS IN SIDEBAR */}
             <div className="mt-auto pt-4">
                 <h3 className="text-lg font-serif font-bold text-slate-300 tracking-widest opacity-80 hover:opacity-100 transition-opacity">
                    SCOME <span className="text-teal-500">|</span> BUSSS
                 </h3>
             </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="md:col-span-8 bg-white md:bg-white/80 md:backdrop-blur-xl md:rounded-3xl p-6 md:p-8 md:shadow-2xl md:shadow-slate-200/50 md:border border-white flex flex-col relative pb-24 md:pb-8">
           
           <div className="flex-1 flex flex-col justify-start md:justify-center">
             
             {/* STEP 1: THE EVENT */}
             {step === 1 && (
                <div className="animate-fade-in-up">
                  <label className="block text-lg font-medium text-slate-800 mb-2">The Event</label>
                  <p className="text-slate-500 text-sm mb-4">What happened? Describe the objective facts of the case.</p>
                  <textarea
                    className="w-full h-48 p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none resize-none text-slate-700 text-base md:text-lg leading-relaxed shadow-inner"
                    placeholder="e.g., During a routine procedure, the patient developed unexpected tachycardia..."
                    value={formData.situation || ''}
                    onChange={(e) => handleChange('situation', e.target.value)}
                    dir="auto"
                    autoFocus
                  />
                  
                  <div className="mt-6">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Clinical Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags?.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium flex items-center gap-1">
                          {tag} <button onClick={() => removeTag(tag)} className="hover:text-teal-900">×</button>
                        </span>
                      ))}
                    </div>
                    <input 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-teal-500 outline-none transition-all"
                      placeholder="Add tags (e.g., Surgery, ER) and press Enter..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                    />
                  </div>
                </div>
             )}

             {/* STEP 2: EMOTIONS */}
             {step === 2 && (
                <div className="animate-fade-in-up">
                  <label className="block text-lg font-medium text-slate-800 mb-4">Emotions & Internal State</label>
                  <p className="text-slate-500 text-sm mb-4">How did you feel during and after the event?</p>
                  <textarea
                    className="w-full h-32 p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none resize-none text-slate-700 text-base md:text-lg leading-relaxed shadow-inner"
                    placeholder="Describe your emotional response (anxiety, frustration, confidence)..."
                    value={formData.emotion || ''}
                    onChange={(e) => handleChange('emotion', e.target.value)}
                    dir="auto"
                    autoFocus
                  />
                  
                  <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Stress / Cognitive Load</label>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${formData.stressLevel! > 7 ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-600'}`}>
                        {formData.stressLevel}/10
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={formData.stressLevel} 
                      onChange={(e) => handleChange('stressLevel', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>
                </div>
             )}

             {/* STEP 3: ANALYSIS */}
             {step === 3 && (
                <div className="animate-fade-in-up">
                  <label className="block text-lg font-medium text-slate-800 mb-4">Analysis</label>
                  <p className="text-slate-500 text-sm mb-4">Why did it happen? Describe the factors involved.</p>

                  <textarea
                    className="w-full h-64 p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none resize-none text-slate-700 text-base md:text-lg leading-relaxed shadow-inner"
                    placeholder="Analyze the contributing factors (knowledge, system, fatigue, etc)..."
                    value={formData.cause || ''}
                    onChange={(e) => handleChange('cause', e.target.value)}
                    dir="auto"
                    autoFocus
                  />
                </div>
             )}

             {/* STEP 4: LESSONS */}
             {step === 4 && (
                <div className="animate-fade-in-up">
                  <label className="block text-lg font-medium text-slate-800 mb-4">Lessons Learned</label>
                  <p className="text-slate-500 text-sm mb-4">What did you learn? Identify key takeaways.</p>

                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Key Takeaway</label>
                  <textarea
                    className="w-full h-64 p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none resize-none text-slate-700 text-base md:text-lg leading-relaxed shadow-inner"
                    placeholder="What will you take forward from this experience?"
                    value={formData.learning || ''}
                    onChange={(e) => handleChange('learning', e.target.value)}
                    dir="auto"
                    autoFocus
                  />
                </div>
             )}

             {/* STEP 5: FUTURE PLAN */}
             {step === 5 && (
                <div className="animate-fade-in-up">
                  <label className="block text-lg font-medium text-slate-800 mb-2">Future Plan</label>
                  <p className="text-slate-500 text-sm mb-4">What will you do differently next time? (Specific actions).</p>
                  <textarea
                    className="w-full h-64 p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none resize-none text-slate-700 text-base md:text-lg leading-relaxed shadow-inner"
                    placeholder="1. Read protocol X...&#10;2. Practice skill Y..."
                    value={formData.plan || ''}
                    onChange={(e) => handleChange('plan', e.target.value)}
                    dir="auto"
                    autoFocus
                  />
                  <div className="mt-4 flex items-center gap-2 text-teal-600 text-sm font-medium bg-teal-50 p-3 rounded-lg border border-teal-100 mb-6">
                    <Target size={16} />
                    <span>This plan will be added to your actionable tasks list.</span>
                  </div>

                  {/* Language Selection */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-100 p-2 rounded-xl mb-4 gap-2">
                    <div className="flex items-center gap-2 px-3">
                       <Globe size={18} className="text-slate-500" />
                       <span className="text-sm font-bold text-slate-600">Mentor Language:</span>
                    </div>
                    <div className="flex gap-1 w-full md:w-auto">
                      <button 
                         onClick={() => setLanguage('arabic')}
                         className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all ${language === 'arabic' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Egyptian Arabic
                      </button>
                      <button 
                         onClick={() => setLanguage('english')}
                         className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all ${language === 'english' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        English
                      </button>
                    </div>
                  </div>
                </div>
             )}
           </div>

           {/* Mobile Sticky Navigation Footer */}
           <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 md:static md:bg-transparent md:border-0 md:p-0 z-40 md:pt-8 flex justify-between items-center safe-pb-4">
             <button 
                onClick={() => setStep(s => s - 1)}
                disabled={step === 1}
                className={`flex items-center text-slate-500 font-medium px-4 py-2 rounded-lg transition-colors ${step === 1 ? 'opacity-0 cursor-default' : 'hover:text-slate-800 hover:bg-slate-100'}`}
              >
                <ArrowLeft size={18} className="mr-2" />
                Back
              </button>

              {step < 5 ? (
                <button 
                  onClick={() => isStepValid() && setStep(s => s + 1)}
                  disabled={!isStepValid()}
                  className={`flex items-center px-6 py-3 md:px-8 md:py-3 rounded-xl transition-all shadow-lg font-medium
                    ${isStepValid() 
                      ? 'bg-slate-900 hover:bg-black text-white hover:shadow-xl' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                >
                  Next
                  <ArrowRight size={18} className="ml-2" />
                </button>
              ) : (
                <button 
                  onClick={handleAnalyze}
                  disabled={!isStepValid()}
                  className={`flex items-center px-6 py-3 md:px-8 md:py-3 rounded-xl transition-all shadow-lg font-medium whitespace-nowrap
                    ${isStepValid()
                      ? 'bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600 text-white hover:shadow-teal-600/30'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                >
                  <Brain size={18} className="mr-2" />
                  Generate Report
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};