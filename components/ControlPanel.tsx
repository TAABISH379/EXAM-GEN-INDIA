import React, { useState } from 'react';
import { ExamParams, SavedPaper, User } from '../types';
import { BookOpen, Loader2, LogOut, History, Trash2, LayoutDashboard, Lock, PlusCircle, Sparkles, Menu, X } from 'lucide-react';

interface ControlPanelProps {
  user: User | null;
  params: ExamParams; 
  setParams: React.Dispatch<React.SetStateAction<ExamParams>>; 
  onGenerate: () => void; 
  onNewExam: () => void;
  isLoading: boolean;
  onLogout: () => void;
  savedPapers: SavedPaper[];
  onLoadPaper: (paper: SavedPaper) => void;
  onDeletePaper: (id: string) => void;
  onShowDashboard: () => void;
  currentView: 'dashboard' | 'paper';
  disabled?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  user, isLoading, onLogout, savedPapers, onLoadPaper, onDeletePaper, onShowDashboard, onNewExam, currentView, disabled = false
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className={`w-full md:w-80 bg-[#0f172a] text-slate-300 flex flex-col md:h-screen sticky top-0 z-50 md:z-20 border-b md:border-b-0 md:border-r border-slate-800 shadow-2xl transition-all font-sans ${disabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
      
      {/* Overlay for Disabled State */}
      {disabled && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-none md:rounded-r-none">
           <div className="p-4 bg-slate-900 rounded-full mb-3 border border-slate-700 shadow-2xl animate-pulse">
             <Lock className="w-6 h-6 text-indigo-400" />
           </div>
           <p className="text-xs font-bold text-white uppercase tracking-widest drop-shadow-md">Exam Mode Active</p>
        </div>
      )}

      {/* App Header & Mobile Toggle */}
      <div className="p-4 md:p-6 pb-2 md:pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-indigo-400/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">ExamGen</h1>
            <p className="text-indigo-400 text-[10px] font-bold tracking-[0.2em] uppercase">AI Paper Setter</p>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Collapsible Content for Mobile */}
      <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col flex-1 overflow-y-auto custom-scrollbar`}>
        
        {/* User Profile Card */}
        {user && (
          <div className="px-4 md:px-6 mb-6 mt-2">
            <div className="p-4 bg-slate-800/40 rounded-2xl border border-white/5 flex items-center gap-3 hover:bg-slate-800 transition-all cursor-default group relative overflow-hidden">
               {/* Subtle glow effect */}
               <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
               
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-inner border border-white/10 group-hover:scale-105 transition-transform relative z-10 shrink-0">
                  {user.name.charAt(0)}
               </div>
               <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-200 transition-colors">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate font-medium group-hover:text-slate-400">{user.board} • Class {user.classLevel}</p>
               </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="px-4 md:px-6 mb-6 space-y-2">
          <button
            onClick={() => {
              onShowDashboard();
              setIsMobileMenuOpen(false);
            }}
            disabled={disabled}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-between group ${
               currentView === 'dashboard' 
               ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]'
               : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
               <LayoutDashboard className={`w-4 h-4 ${currentView === 'dashboard' ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} /> 
               Dashboard
            </div>
            {currentView === 'dashboard' && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]"></div>}
          </button>

          <button
            onClick={() => {
              onNewExam();
              setIsMobileMenuOpen(false);
            }}
            disabled={disabled || isLoading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-3 bg-slate-800/50 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:text-emerald-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] group"
          >
             {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform" />} 
             Start New Exam
          </button>
        </div>

        {/* Saved Papers Section */}
        <div className="flex-1 px-4 md:px-6 mt-2 border-t border-slate-800/50 pt-6 min-h-[150px]">
          <label className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
            <History className="w-3 h-3 text-indigo-400" /> Recent Papers
          </label>
          
          <div className="space-y-1 pb-6">
            {savedPapers.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl bg-slate-800/20 mx-2">
                <Sparkles className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">No saved papers.</p>
              </div>
            ) : (
              savedPapers.map((saved) => (
                <div 
                  key={saved.id}
                  className="group relative rounded-xl hover:bg-slate-800 transition-colors cursor-pointer overflow-hidden p-2 mx-1"
                  onClick={() => {
                    if (!disabled) {
                      onLoadPaper(saved);
                      setIsMobileMenuOpen(false);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                     <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-400 truncate group-hover:text-white transition-colors">{saved.paper.subject}</h4>
                        <p className="text-[10px] text-slate-600 group-hover:text-slate-500">{formatDate(saved.timestamp)}</p>
                     </div>
                     
                     {!disabled && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePaper(saved.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Paper"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                     )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 mt-auto border-t border-slate-800 bg-[#0f172a] sticky bottom-0 z-10">
          <button
            onClick={onLogout}
            disabled={disabled}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};