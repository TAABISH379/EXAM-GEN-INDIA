import React from 'react';
import { PastExam, User } from '../types';
import { LayoutDashboard, TrendingUp, Clock, BookOpen, Award, ArrowRight, BookCheck, Sparkles, UserCheck, Zap } from 'lucide-react';

interface DashboardProps {
  user: User;
  pastExams: PastExam[];
  onViewExam: (exam: PastExam) => void;
  onStartNew: (mode: 'exam' | 'practice') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, pastExams, onViewExam, onStartNew }) => {
  
  // Calculate Stats
  const totalExams = pastExams.length;
  const avgScore = totalExams > 0 
    ? Math.round(pastExams.reduce((acc, curr) => acc + (curr.score / curr.totalMarks) * 100, 0) / totalExams) 
    : 0;
  
  // Helper to format date
  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="max-w-6xl mx-auto w-full animate-fade-in-up pb-20">
      
      {/* Welcome Banner */}
      <div className="mb-6 md:mb-8 bg-slate-900 rounded-[2rem] p-6 md:p-12 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
         {/* Decorative Background Elements */}
         <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-indigo-600/30 rounded-full -translate-y-1/2 translate-x-1/3 blur-[60px] md:blur-[100px] group-hover:bg-indigo-600/40 transition-colors duration-700"></div>
         <div className="absolute bottom-0 left-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-violet-600/20 rounded-full translate-y-1/3 -translate-x-1/4 blur-[50px] md:blur-[80px]"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
         
         <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8">
            <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-4 text-indigo-200 backdrop-blur-md">
                   <UserCheck className="w-3 h-3" /> {user.board} • Class {user.classLevel}
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
                   Ready to excel, <br/> {user.name.split(' ')[0]}?
                </h1>
                <p className="text-slate-300 opacity-90 text-sm md:text-lg leading-relaxed font-medium">
                   Your AI tutor is ready. Start a mock exam to simulate real conditions or practice specific topics.
                </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button 
                 onClick={() => onStartNew('exam')}
                 className="flex-1 sm:flex-none px-6 md:px-8 py-3.5 md:py-4 bg-white text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-xs md:text-sm uppercase tracking-wider"
              >
                 <BookOpen className="w-4 h-4 text-indigo-600" /> Start Mock Exam
              </button>
              <button 
                 onClick={() => onStartNew('practice')}
                 className="flex-1 sm:flex-none px-6 md:px-8 py-3.5 md:py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 font-bold rounded-xl hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-xs md:text-sm uppercase tracking-wider"
              >
                 <BookCheck className="w-4 h-4 text-emerald-400" /> Practice Questions
              </button>
            </div>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
         
         {/* Average Score Card */}
         <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 group relative overflow-hidden sm:col-span-2 md:col-span-1">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
               <Award className="w-24 h-24 text-indigo-600" />
            </div>
            <div className="relative z-10">
               <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                  <Award className="w-5 h-5 md:w-6 md:h-6" />
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Average Score</p>
               <div className="flex items-end gap-2 mb-2">
                  <h3 className="text-3xl md:text-4xl font-black text-slate-800">{avgScore}%</h3>
               </div>
               {/* Progress Bar */}
               <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                     className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000 ease-out"
                     style={{ width: `${avgScore}%` }}
                  ></div>
               </div>
            </div>
         </div>

         {/* Exams Taken Card */}
         <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
               <LayoutDashboard className="w-24 h-24 text-emerald-600" />
            </div>
            <div className="relative z-10">
               <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                  <Zap className="w-5 h-5 md:w-6 md:h-6" />
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Exams</p>
               <h3 className="text-3xl md:text-4xl font-black text-slate-800">{totalExams}</h3>
               <p className="text-sm text-slate-500 mt-2 font-medium">Keep the streak going!</p>
            </div>
         </div>

         {/* Last Activity Card */}
         <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
               <Clock className="w-24 h-24 text-orange-600" />
            </div>
            <div className="relative z-10">
               <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                  <Clock className="w-5 h-5 md:w-6 md:h-6" />
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Last Activity</p>
               <h3 className="text-base md:text-lg font-bold text-slate-800 truncate mb-1">
                  {pastExams.length > 0 ? formatDate(pastExams[0].timestamp) : 'No Activity'}
               </h3>
               <p className="text-xs text-slate-400 font-medium">
                  {pastExams.length > 0 ? 'Review your feedback' : 'Start your first exam'}
               </p>
            </div>
         </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
         <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 backdrop-blur-sm">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-3">
               <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" /> Recent Performance
            </h3>
         </div>

         {pastExams.length === 0 ? (
            <div className="p-10 md:p-20 text-center text-slate-400 flex flex-col items-center justify-center">
               <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 md:mb-6 animate-float">
                  <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-slate-300" />
               </div>
               <p className="font-medium text-base md:text-lg text-slate-600">No exams taken yet</p>
               <p className="text-xs md:text-sm mt-2 text-slate-400 max-w-xs mx-auto">Generate a paper to start tracking your performance analytics.</p>
            </div>
         ) : (
            <div className="divide-y divide-slate-100">
               {pastExams.map((exam) => (
                  <div key={exam.id} className="p-4 md:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 group cursor-pointer relative overflow-hidden" onClick={() => onViewExam(exam)}>
                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                     
                     <div className="flex items-start gap-4 md:gap-5">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg md:text-xl shadow-sm border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shrink-0">
                           {exam.subject.charAt(0)}
                        </div>
                        <div className="min-w-0">
                           <h4 className="font-bold text-slate-900 mb-1 text-base md:text-lg group-hover:text-indigo-700 transition-colors truncate pr-4">{exam.paperTitle}</h4>
                           <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                              <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600 border border-slate-200">{exam.subject}</span>
                              <span>{formatDate(exam.timestamp)}</span>
                           </div>
                        </div>
                     </div>
                     
                     <div className="flex items-center justify-between sm:justify-end gap-6 md:gap-10 sm:self-center w-full sm:w-auto mt-2 sm:mt-0 pl-[4rem] sm:pl-0">
                        <div className="text-left sm:text-right">
                           <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Score Obtained</span>
                           <div className="flex items-baseline sm:justify-end gap-1">
                              <span className={`text-xl md:text-2xl font-black ${
                                 (exam.score / exam.totalMarks) >= 0.75 ? 'text-emerald-600' : 
                                 (exam.score / exam.totalMarks) >= 0.4 ? 'text-orange-500' : 'text-red-500'
                              }`}>
                                 {exam.score}
                              </span>
                              <span className="text-xs md:text-sm font-bold text-slate-400">/{exam.totalMarks}</span>
                           </div>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300 group-hover:translate-x-2 shadow-sm shrink-0">
                           <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
};