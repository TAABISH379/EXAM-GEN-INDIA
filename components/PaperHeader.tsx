import React from 'react';
import { ExamPaper } from '../types';
import { GraduationCap, BookOpen, ShieldCheck } from 'lucide-react';

interface PaperHeaderProps {
  paper: ExamPaper;
}

export const PaperHeader: React.FC<PaperHeaderProps> = ({ paper }) => {
  return (
    <div className="mb-8 md:mb-12 font-serif text-slate-900 relative">
      
      {/* Background Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none scale-150">
        {paper.board === 'CBSE' ? <BookOpen className="w-64 h-64" /> : <GraduationCap className="w-64 h-64" />}
      </div>

      {/* Top Banner / Board Title */}
      <div className="text-center relative pb-6 border-b-4 border-slate-900 double-border">
        <div className="flex items-center justify-between absolute top-0 w-full px-4 md:px-0 opacity-80">
           <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden md:block">
              ExamGen India
           </div>
           <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden md:block">
              Confidential
           </div>
        </div>

        <div className="flex items-center justify-center mb-4 mt-4 text-slate-800">
             {paper.board === 'CBSE' ? <BookOpen className="w-10 h-10 md:w-12 md:h-12 stroke-[1.5]" /> : <GraduationCap className="w-10 h-10 md:w-12 md:h-12 stroke-[1.5]" />}
        </div>
        
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-wide mb-2 leading-none text-slate-900 px-4">
          {paper.title}
        </h1>
        
        <div className="inline-flex items-center justify-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white bg-slate-900 px-4 md:px-6 py-1.5 rounded-full mb-4 print:text-black print:bg-transparent print:border print:border-black">
          <span>{paper.board} Board</span>
          <span className="w-1 h-1 rounded-full bg-slate-500"></span>
          <span>Class {paper.classLevel}</span>
        </div>
      </div>

      {/* Technical Details Grid - Mimicking Official Header Box */}
      <div className="flex flex-col md:flex-row border-b-2 border-l-2 border-r-2 border-slate-900 text-sm mt-1 bg-slate-50 print:bg-white">
         <div className="flex-1 p-3 md:p-4 border-b-2 md:border-b-0 border-r-2 border-slate-900 flex flex-col justify-center text-center md:text-left">
            <span className="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</span>
            <span className="font-bold text-lg md:text-xl uppercase block leading-none tracking-tight">{paper.subject}</span>
         </div>
         <div className="w-full md:w-32 p-3 md:p-4 border-b-2 md:border-b-0 border-r-2 border-slate-900 text-center flex flex-row md:flex-col justify-between md:justify-center items-center bg-white gap-2">
             <span className="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider mb-0 md:mb-1">Time</span>
             <span className="font-bold text-lg md:text-xl block leading-none">{paper.timeAllowed}</span>
         </div>
         <div className="w-full md:w-32 p-3 md:p-4 text-center md:text-right flex flex-row md:flex-col justify-between md:justify-center items-center bg-white gap-2">
             <span className="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider mb-0 md:mb-1">Max. Marks</span>
             <span className="font-bold text-lg md:text-xl block leading-none">{paper.maximumMarks}</span>
         </div>
      </div>
      
      {/* Set Code Mockup */}
      <div className="absolute top-2 right-0 hidden lg:block print:block">
         <div className="border border-slate-400 p-1 px-2 text-[10px] font-mono font-bold text-slate-500">
            SET-1
         </div>
      </div>
    </div>
  );
};