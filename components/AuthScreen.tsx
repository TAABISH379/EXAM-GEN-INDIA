import React, { useState } from 'react';
import { User, Board, ClassLevel } from '../types';
import { BOARDS, CLASSES } from '../constants';
import { BookOpen, Mail, Lock, User as UserIcon, ArrowRight, Loader2, GraduationCap, CheckCircle2, Sparkles } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    board: 'CBSE' as Board,
    classLevel: '10' as ClassLevel
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulate Network Request
    setTimeout(() => {
      setIsLoading(false);
      
      if (isLogin) {
        // Mock Login
        const mockName = formData.email.split('@')[0];
        const user: User = {
          name: mockName.charAt(0).toUpperCase() + mockName.slice(1),
          email: formData.email,
          board: 'CBSE', 
          classLevel: '10'
        };
        onLogin(user);
      } else {
        // Mock Signup
        const user: User = {
          name: formData.name,
          email: formData.email,
          board: formData.board,
          classLevel: formData.classLevel
        };
        onLogin(user);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      {/* Left Panel - Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] relative overflow-hidden flex-col justify-between p-16 text-white">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

        <div className="relative z-10">
           <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/30">
                 <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">ExamGen India</span>
           </div>

           <h1 className="text-5xl font-bold leading-tight mb-6">
              Master your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Board Exams</span> with AI.
           </h1>
           <p className="text-slate-400 text-lg max-w-md leading-relaxed">
              Generate unlimited sample papers, get instant grading, and practice with AI-proctored mock tests designed for CBSE & ICSE.
           </p>
        </div>

        <div className="relative z-10 space-y-4">
           <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Latest Syllabus Compliant</span>
           </div>
           <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>AI-Powered Evaluation</span>
           </div>
           <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Smart Proctoring System</span>
           </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 relative">
        <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 animate-fade-in-up">
          
          <div className="mb-8 text-center">
             <div className="lg:hidden flex justify-center mb-4">
               <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
                 <BookOpen className="w-8 h-8 text-white" />
               </div>
             </div>
             <h2 className="text-2xl font-bold text-slate-900 mb-2">{isLogin ? 'Welcome back' : 'Create an account'}</h2>
             <p className="text-slate-500 text-sm">
                {isLogin ? 'Enter your credentials to access your portal.' : 'Get started with your exam preparation journey.'}
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> {error}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-5 animate-fade-in-up">
                 <div className="group">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Full Name</label>
                    <div className="relative">
                       <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                       <input 
                         type="text"
                         name="name"
                         placeholder="e.g. Rahul Sharma"
                         required={!isLogin}
                         value={formData.name}
                         onChange={handleChange}
                         className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                       />
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="group">
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Board</label>
                       <div className="relative">
                          <GraduationCap className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                          <select 
                            name="board"
                            value={formData.board}
                            onChange={handleChange}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none text-slate-900 font-medium cursor-pointer"
                          >
                            {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                       </div>
                    </div>
                    <div className="group">
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Class</label>
                       <div className="relative">
                          <select 
                            name="classLevel"
                            value={formData.classLevel}
                            onChange={handleChange}
                            className="w-full pl-4 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none text-slate-900 font-medium cursor-pointer"
                          >
                            {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                          </select>
                          <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">
                             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            <div className="group">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Email Address</label>
               <div className="relative">
                 <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                 <input 
                   type="email"
                   name="email"
                   placeholder="student@example.com"
                   required
                   value={formData.email}
                   onChange={handleChange}
                   className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                 />
               </div>
            </div>

            <div className="group">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Password</label>
               <div className="relative">
                 <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                 <input 
                   type="password"
                   name="password"
                   placeholder="••••••••"
                   required
                   value={formData.password}
                   onChange={handleChange}
                   className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                 />
               </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-bold text-sm uppercase tracking-wide shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Access Portal' : 'Create Account'} <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-slate-500 text-sm">
              {isLogin ? "New to ExamGen?" : "Already have an account?"}{" "}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
              >
                {isLogin ? "Create Account" : "Login"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};