import React, { useState, useRef, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { PaperHeader } from './components/PaperHeader';
import { PaperInstructions } from './components/PaperInstructions';
import { PaperSection } from './components/PaperSection';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { ExamOverlay } from './components/ExamOverlay';
import { ExamPaper, ExamParams, User, SavedPaper, PastExam } from './types';
import { generateExamPaper, generateDiagramImage, evaluateAnswerSheet } from './services/geminiService';
import { Printer, Bookmark, Eye, Play, ArrowLeft, BookMarked, Settings, ChevronDown, BookCheck, GraduationCap, BrainCircuit, Sparkles, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { CLASS_10_SUBJECTS, CLASS_12_SUBJECTS } from './constants';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [params, setParams] = useState<ExamParams>({
    board: 'CBSE',
    classLevel: '10',
    subject: 'Science',
    difficulty: 'Standard',
    mode: 'exam'
  });

  const [savedPapers, setSavedPapers] = useState<SavedPaper[]>([]);
  const [pastExams, setPastExams] = useState<PastExam[]>([]);
  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'paper' | 'marking' | 'result'>('paper');
  const [isSaving, setIsSaving] = useState(false);
  const [appState, setAppState] = useState<'dashboard' | 'generator'>('dashboard');
  const [isExamMode, setIsExamMode] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [currentResult, setCurrentResult] = useState<PastExam | null>(null);

  // Load User, Saved Papers, and Past Exams
  useEffect(() => {
    const storedUser = localStorage.getItem('examgen_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      setParams(prev => ({
        ...prev,
        board: userData.board,
        classLevel: userData.classLevel,
        subject: userData.classLevel === '10' ? 'Science' : 'Physics',
        mode: 'exam'
      }));

      // Load saved papers
      const savedKey = `examgen_saved_${userData.email}`;
      const saved = localStorage.getItem(savedKey);
      if (saved) setSavedPapers(JSON.parse(saved));

      // Load past exams
      const examsKey = `examgen_exams_${userData.email}`;
      const exams = localStorage.getItem(examsKey);
      if (exams) setPastExams(JSON.parse(exams));
    }
  }, []);

  const printRef = useRef<HTMLDivElement>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('examgen_user', JSON.stringify(userData));
    setParams(prev => ({
      ...prev,
      board: userData.board,
      classLevel: userData.classLevel,
      subject: userData.classLevel === '10' ? 'Science' : 'Physics'
    }));
    
    // Load User Data
    const savedKey = `examgen_saved_${userData.email}`;
    const saved = localStorage.getItem(savedKey);
    setSavedPapers(saved ? JSON.parse(saved) : []);

    const examsKey = `examgen_exams_${userData.email}`;
    const exams = localStorage.getItem(examsKey);
    setPastExams(exams ? JSON.parse(exams) : []);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('examgen_user');
    setPaper(null); 
    setSavedPapers([]);
    setPastExams([]);
    setAppState('dashboard');
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setAppState('generator');
    setPaper(null);
    setCurrentResult(null);
    setIsExamMode(false);
    
    try {
      const generatedPaper = await generateExamPaper(params);
      setPaper(generatedPaper);
      setViewMode('paper');
      setIsExamMode(true); // Automatically start exam mode/view
    } catch (err: any) {
      setError(err.message || "Failed to generate paper. Please check API key or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePaper = () => {
    if (!paper || !user) return;
    setIsSaving(true);
    setTimeout(() => {
        const newSavedPaper: SavedPaper = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          paper: paper
        };
        const updatedSavedPapers = [newSavedPaper, ...savedPapers];
        setSavedPapers(updatedSavedPapers);
        localStorage.setItem(`examgen_saved_${user.email}`, JSON.stringify(updatedSavedPapers));
        setIsSaving(false);
    }, 600);
  };

  const handleDeletePaper = (id: string) => {
    if (!user) return;
    const updated = savedPapers.filter(p => p.id !== id);
    setSavedPapers(updated);
    localStorage.setItem(`examgen_saved_${user.email}`, JSON.stringify(updated));
  };

  const handleLoadPaper = (saved: SavedPaper) => {
    setPaper(saved.paper);
    setError(null);
    setAppState('generator');
    setViewMode('paper');
    setCurrentResult(null);
  };

  const handleStartExam = () => {
    setIsExamMode(true);
  };

  const handleStartNewExam = (mode: 'exam' | 'practice' = 'exam') => {
    setParams(prev => ({ ...prev, mode }));
    setAppState('generator');
    setPaper(null);
    setCurrentResult(null);
    setIsExamMode(false);
  };

  // Convert File to Base64 helper
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmitExam = async (files: File[]) => {
    if (!paper || !user) return;
    setIsGrading(true);
    
    try {
      // 1. Convert images to Base64
      const base64Images = await Promise.all(files.map(fileToBase64));
      
      // 2. Call Gemini for Evaluation
      const evaluation = await evaluateAnswerSheet(paper, base64Images);
      
      // 3. Create PastExam record
      const examRecord: PastExam = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        subject: paper.subject,
        paperTitle: paper.title,
        score: evaluation.totalScore,
        totalMarks: paper.maximumMarks,
        evaluation: evaluation
      };

      // 4. Update State & Storage
      const updatedExams = [examRecord, ...pastExams];
      setPastExams(updatedExams);
      localStorage.setItem(`examgen_exams_${user.email}`, JSON.stringify(updatedExams));
      
      // 5. Switch to Results View
      setIsExamMode(false);
      setIsGrading(false);
      setCurrentResult(examRecord);
      setViewMode('result');
      setAppState('generator'); // Stay in generator view to show result
      
    } catch (err: any) {
      console.error(err);
      setError("Grading failed: " + err.message);
      setIsExamMode(false);
      setIsGrading(false);
    }
  };

  const handleViewExamResult = (exam: PastExam) => {
     setCurrentResult(exam);
     setPaper(null); // Or reconstruct paper if stored fully, but simplified for now
     setAppState('generator');
     setViewMode('result');
  };

  const handleGenerateImage = async (sectionIndex: number, questionId: string, description: string) => {
    if (!paper) return;
    try {
      const imageUrl = await generateDiagramImage(description);
      setPaper(prevPaper => {
        if (!prevPaper) return null;
        const newSections = [...prevPaper.sections];
        const section = newSections[sectionIndex];
        const questionIndex = section.questions.findIndex(q => q.id === questionId);
        if (questionIndex !== -1) {
          section.questions[questionIndex] = {
            ...section.questions[questionIndex],
            imageUrl: imageUrl
          };
        }
        return { ...prevPaper, sections: newSections };
      });
      return imageUrl;
    } catch (err) {
      console.error(err); throw err;
    }
  };

  const handlePrint = () => window.print();

  if (!user) return <AuthScreen onLogin={handleLogin} />;
  
  const availableSubjects = user.classLevel === '10' ? CLASS_10_SUBJECTS : CLASS_12_SUBJECTS;
  const isPracticeMode = params.mode === 'practice';

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      
      {/* Exam Overlay - Only for Exam Mode */}
      {isExamMode && paper && !isPracticeMode && (
        <ExamOverlay 
          duration={paper.timeAllowed}
          subject={paper.subject}
          difficulty={params.difficulty}
          onClose={() => setIsExamMode(false)}
          onSubmit={handleSubmitExam}
          isSubmitting={isGrading}
        />
      )}

      {/* Sidebar */}
      <ControlPanel 
        user={user}
        params={params} 
        setParams={setParams} 
        onGenerate={handleGenerate} 
        onNewExam={() => handleStartNewExam('exam')}
        isLoading={isLoading}
        onLogout={handleLogout}
        savedPapers={savedPapers}
        onLoadPaper={handleLoadPaper}
        onDeletePaper={handleDeletePaper}
        onShowDashboard={() => setAppState('dashboard')}
        currentView={appState === 'dashboard' ? 'dashboard' : 'paper'}
        disabled={isExamMode && !isPracticeMode}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative scroll-smooth bg-slate-50">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.4]"
             style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>

        <div className="relative z-10 min-h-full flex flex-col p-4 md:p-8 lg:p-12">
          
          {/* Dashboard View */}
          {appState === 'dashboard' && (
            <Dashboard 
               user={user} 
               pastExams={pastExams} 
               onViewExam={handleViewExamResult}
               onStartNew={handleStartNewExam}
            />
          )}

          {/* Generator / Result View */}
          {appState === 'generator' && (
             <>
               {error && (
                <div className="max-w-3xl mx-auto mb-8 w-full p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-4 text-red-700 shadow-sm animate-fade-in-up">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div><p className="font-semibold">Error</p><p className="text-sm opacity-90">{error}</p></div>
                </div>
               )}

               {/* Empty State / Configuration Screen */}
               {!paper && !isLoading && !error && !currentResult && (
                 <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full animate-fade-in-up py-8">
                   
                   <div className="w-full bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white overflow-hidden">
                      
                      {/* Config Header */}
                      <div className="p-8 pb-4 text-center">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3 transition-colors ${isPracticeMode ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                           <Sparkles className="w-7 h-7" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Configure Your Session</h2>
                        <p className="text-slate-500 font-medium">Select your preferred mode and parameters.</p>
                      </div>
                      
                      <div className="p-8 pt-0">
                        {/* 1. Mode Selection Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                          
                          {/* Exam Mode Card */}
                          <div 
                             onClick={() => setParams(prev => ({ ...prev, mode: 'exam' }))}
                             className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 group ${
                               params.mode === 'exam' 
                               ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-4 ring-indigo-500/10' 
                               : 'border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/20'
                             }`}
                          >
                             <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${params.mode === 'exam' ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                   <GraduationCap className="w-6 h-6" />
                                </div>
                                {params.mode === 'exam' && <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white"><BookCheck className="w-3 h-3" /></div>}
                             </div>
                             <h3 className={`text-lg font-bold mb-1 ${params.mode === 'exam' ? 'text-indigo-900' : 'text-slate-700'}`}>Mock Exam Mode</h3>
                             <p className="text-sm text-slate-500 leading-relaxed">
                               Full-length, timed simulation with AI proctoring and strict marking schemes. Best for final prep.
                             </p>
                          </div>

                          {/* Practice Mode Card */}
                          <div 
                             onClick={() => setParams(prev => ({ ...prev, mode: 'practice' }))}
                             className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 group ${
                               params.mode === 'practice' 
                               ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-4 ring-emerald-500/10' 
                               : 'border-slate-100 bg-slate-50 hover:border-emerald-200 hover:bg-emerald-50/20'
                             }`}
                          >
                             <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${params.mode === 'practice' ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                   <BrainCircuit className="w-6 h-6" />
                                </div>
                                {params.mode === 'practice' && <div className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center text-white"><BookCheck className="w-3 h-3" /></div>}
                             </div>
                             <h3 className={`text-lg font-bold mb-1 ${params.mode === 'practice' ? 'text-emerald-900' : 'text-slate-700'}`}>Practice Mode</h3>
                             <p className="text-sm text-slate-500 leading-relaxed">
                               Relaxed environment. Reveal answers instantly, no timer, no proctoring. Best for concept building.
                             </p>
                          </div>
                        </div>

                        {/* 2. Dropdowns */}
                        <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                             <Settings className="w-3 h-3" /> Session Parameters
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Subject */}
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                              <div className="relative group">
                                 <select
                                   value={params.subject}
                                   onChange={(e) => setParams(prev => ({ ...prev, subject: e.target.value as any }))}
                                   className="w-full appearance-none bg-white border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold text-slate-800 shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all cursor-pointer hover:border-indigo-300"
                                 >
                                   {availableSubjects.map((s) => (
                                     <option key={s} value={s}>{s}</option>
                                   ))}
                                 </select>
                                 <ChevronDown className="absolute right-3.5 top-4 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
                              </div>
                            </div>

                            {/* Difficulty */}
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Difficulty Level</label>
                              <div className="relative group">
                                 <select
                                   value={params.difficulty}
                                   onChange={(e) => setParams(prev => ({ ...prev, difficulty: e.target.value as any }))}
                                   className="w-full appearance-none bg-white border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold text-slate-800 shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all cursor-pointer hover:border-indigo-300"
                                 >
                                   <option value="Standard">Standard (Board Pattern)</option>
                                   <option value="Easy">Easy (Beginner)</option>
                                   <option value="Medium">Medium (Intermediate)</option>
                                   <option value="Hard">Hard (Challenger)</option>
                                 </select>
                                 <ChevronDown className="absolute right-3.5 top-4 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="mt-8">
                          <button
                            onClick={handleGenerate}
                            className={`w-full py-5 rounded-2xl font-bold text-base uppercase tracking-widest text-white shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 ${
                              isPracticeMode 
                              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200' 
                              : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-200'
                            }`}
                          >
                            <Sparkles className="w-5 h-5" /> 
                            Generate {isPracticeMode ? 'Practice Set' : 'Exam Paper'}
                          </button>
                        </div>

                      </div>
                   </div>
                 </div>
               )}

               {/* Result View (AI Feedback) */}
               {viewMode === 'result' && currentResult && (
                  <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
                     <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                        <div>
                           <h2 className="text-2xl font-bold mb-1">Evaluation Result</h2>
                           <p className="text-slate-400">{currentResult.paperTitle}</p>
                        </div>
                        <div className="text-right">
                           <div className="text-3xl font-bold text-emerald-400">
                              {currentResult.score}/{currentResult.totalMarks}
                           </div>
                           <p className="text-xs uppercase tracking-widest text-slate-500">Total Score</p>
                        </div>
                     </div>
                     
                     <div className="p-8">
                        <div className="mb-8 p-6 bg-indigo-50 rounded-xl border border-indigo-100">
                           <h3 className="font-bold text-indigo-900 mb-2">Overall Feedback</h3>
                           <p className="text-indigo-800 leading-relaxed">{currentResult.evaluation.generalFeedback}</p>
                        </div>

                        <div className="space-y-6">
                           <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Question Breakdown</h3>
                           {currentResult.evaluation.questionEvaluations.map((evalItem, idx) => (
                              <div key={idx} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                 <div className="w-12 h-12 flex-shrink-0 bg-white rounded-full flex items-center justify-center font-bold text-slate-700 shadow-sm border border-slate-200">
                                    {evalItem.questionId}
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex justify-between mb-2">
                                       <span className="font-semibold text-slate-700">Marks Awarded</span>
                                       <span className="font-bold text-slate-900">{evalItem.marksObtained}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 italic">"{evalItem.feedback}"</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                     <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                        <button onClick={() => setAppState('dashboard')} className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 font-bold text-sm uppercase">
                           <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                        </button>
                        
                        {paper && (
                           <button 
                              onClick={() => { setCurrentResult(null); setViewMode('marking'); }} 
                              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm uppercase shadow-lg hover:bg-indigo-500 transition-all animate-pulse-slow"
                           >
                              <BookOpen className="w-4 h-4" /> View Answer Key
                           </button>
                        )}
                     </div>
                  </div>
               )}

               {/* Paper View */}
               {paper && !isLoading && viewMode !== 'result' && (
                 <div className="w-full max-w-[210mm] mx-auto animate-fade-in-up">
                   
                   {/* Toolbar */}
                   <div className="sticky top-4 z-40 mb-8 p-1.5 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 flex flex-wrap items-center justify-between gap-4 print:hidden">
                     <div className="flex bg-slate-100/50 p-1 rounded-xl">
                       <button onClick={() => setViewMode('paper')} disabled={isExamMode && !isPracticeMode} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${viewMode === 'paper' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Question Paper</button>
                       {(!isExamMode || isPracticeMode) && (
                          <button onClick={() => setViewMode('marking')} disabled={isExamMode && !isPracticeMode} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${viewMode === 'marking' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Answer Key</button>
                       )}
                     </div>
                     <div className="flex items-center gap-2">
                        {isExamMode && !isPracticeMode ? (
                           <div className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold uppercase shadow-lg flex items-center gap-2 animate-pulse">
                              <Loader2 className="w-3 h-3 animate-spin" /> Exam In Progress
                           </div>
                        ) : !isPracticeMode ? (
                           <button onClick={handleStartExam} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase shadow-lg hover:bg-indigo-500 transition-all">
                              <Play className="w-3 h-3" /> Exam Timer
                           </button>
                        ) : (
                           <div className="px-5 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold uppercase shadow-sm flex items-center gap-2 border border-emerald-200">
                              <BookCheck className="w-3 h-3" /> Practice Mode
                           </div>
                        )}
                        
                        <button onClick={handleSavePaper} disabled={isSaving || (isExamMode && !isPracticeMode)} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 disabled:opacity-50 transition-colors">
                           {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className="w-4 h-4" />}
                        </button>
                        <button onClick={handlePrint} className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                           <Printer className="w-4 h-4" />
                        </button>
                     </div>
                   </div>

                   {/* Paper Content */}
                   <div id="paper-content" ref={printRef} className="bg-white min-h-[297mm] p-[15mm] md:p-[20mm] shadow-2xl relative overflow-hidden print:shadow-none print:w-full">
                      <PaperHeader paper={paper} />
                      <PaperInstructions instructions={paper.generalInstructions} />
                      <div className="space-y-10">
                        {paper.sections.map((section, idx) => (
                          <PaperSection 
                            key={idx} 
                            section={section} 
                            showMarkingScheme={viewMode === 'marking'} 
                            isPracticeMode={isPracticeMode}
                            onGenerateImage={(qId, desc) => handleGenerateImage(idx, qId, desc)}
                          />
                        ))}
                      </div>
                   </div>
                 </div>
               )}
             </>
          )}
        </div>
      </main>
    </div>
  );
};