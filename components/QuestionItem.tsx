import React, { useState } from 'react';
import { Question } from '../types';
import { ImageIcon, Loader2, RefreshCw, Eye } from 'lucide-react';

interface QuestionItemProps {
  question: Question;
  index: number;
  showMarkingScheme: boolean;
  isPracticeMode?: boolean;
  onGenerateImage?: (questionId: string, description: string) => Promise<string | undefined>;
}

export const QuestionItem: React.FC<QuestionItemProps> = ({ question, index, showMarkingScheme, isPracticeMode, onGenerateImage }) => {
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleGenerateClick = async () => {
    if (!onGenerateImage || !question.imageDescription) return;
    setIsGeneratingImg(true);
    try {
      await onGenerateImage(question.id, question.imageDescription);
    } catch (e) {
      // Error is logged in parent
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const displayScheme = showMarkingScheme || (isPracticeMode && showAnswer);

  return (
    <div className="mb-10 break-inside-avoid relative group transition-colors hover:bg-slate-50/50 p-2 -mx-2 rounded-xl">
      <div className="flex items-start gap-4 font-serif text-slate-900">
        <span className="font-bold min-w-[36px] text-lg leading-tight text-slate-900/70 pt-0.5">{question.id}.</span>
        
        <div className="flex-1">
          <p className="whitespace-pre-wrap mb-5 leading-loose text-base md:text-lg text-justify text-slate-800 font-medium">
            {question.questionText}
          </p>

          {/* Diagram / Image Section */}
          {question.imageDescription && (
            <div className="my-6">
              {question.imageUrl ? (
                <div className="flex justify-center">
                  <div className="relative border border-slate-200 p-2 bg-white shadow-sm inline-block max-w-full rounded-lg">
                    <img 
                      src={question.imageUrl} 
                      alt="Diagram" 
                      className="max-h-64 object-contain mix-blend-multiply" 
                    />
                    <p className="text-center text-xs font-sans italic text-slate-500 mt-2 print:hidden">
                      Figure: {question.imageDescription.slice(0, 50)}...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 bg-slate-50 flex flex-col items-center justify-center text-center gap-3 print:border-slate-800 print:bg-white group-hover:bg-white transition-colors">
                  <div className="p-3 bg-white rounded-full shadow-sm print:hidden">
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="print:hidden">
                    <p className="text-sm font-semibold text-slate-700 mb-1">Diagram Required</p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mb-3 italic">"{question.imageDescription}"</p>
                    
                    <button
                      onClick={handleGenerateClick}
                      disabled={isGeneratingImg || !onGenerateImage}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 shadow-sm rounded-lg text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors disabled:opacity-50"
                    >
                      {isGeneratingImg ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Drawing...</>
                      ) : (
                        <><RefreshCw className="w-3 h-3" /> Generate Diagram</>
                      )}
                    </button>
                  </div>
                  <div className="hidden print:block text-slate-400 text-xs italic">
                    [Space for Diagram: {question.imageDescription}]
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* MCQs Options */}
          {question.type === 'MCQ' && question.options && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mt-4 ml-1 mb-6">
              {question.options.map((opt, i) => (
                <div key={i} className="flex items-baseline gap-3 text-base group/opt hover:text-indigo-800 transition-colors cursor-default">
                  <span className="font-bold text-slate-500 min-w-[24px] group-hover/opt:text-indigo-500">({String.fromCharCode(97 + i)})</span>
                  <span className="text-slate-800">{opt}</span>
                </div>
              ))}
            </div>
          )}

          {/* Practice Mode Button */}
          {isPracticeMode && (
            <div className="mt-4 print:hidden">
               <button 
                  onClick={() => setShowAnswer(!showAnswer)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${showAnswer ? 'bg-slate-100 border-slate-300 text-slate-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100 hover:scale-105'}`}
               >
                  <Eye className="w-3 h-3" /> {showAnswer ? 'Hide Answer' : 'Show Answer'}
               </button>
            </div>
          )}
        </div>

        <div className="font-bold text-sm text-slate-500 whitespace-nowrap pt-1 bg-slate-100 px-2 py-1 rounded">
          {question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}
        </div>
      </div>

      {/* Marking Scheme View */}
      {displayScheme && (
        <div className="mt-4 ml-12 relative animate-fade-in-down">
           {/* Visual Connector Line */}
           <div className="absolute -left-6 top-0 bottom-0 w-0.5 bg-emerald-200/50 rounded-full print:border-l print:border-black print:bg-transparent"></div>
           
           <div className="p-6 bg-emerald-50/60 rounded-xl border border-emerald-100/80 text-sm font-sans text-slate-700 shadow-sm print:bg-transparent print:border-none print:p-0 print:shadow-none">
            <h4 className="font-bold text-emerald-800 mb-3 text-[10px] uppercase tracking-widest flex items-center gap-2 print:text-black">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 print:bg-black"></span> Marking Scheme
            </h4>
            
            {question.type === 'MCQ' && (
              <div className="mb-4 p-3 bg-white rounded-lg inline-block border border-emerald-100 print:bg-transparent print:p-0 print:border-none shadow-sm">
                <span className="text-emerald-800 font-bold text-xs uppercase mr-2 print:text-black">Correct Answer:</span>
                <span className="font-serif font-bold text-slate-900 text-lg">{question.correctAnswer}</span>
              </div>
            )}
            
            <ul className="space-y-3">
              {question.markingScheme.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-700 leading-relaxed bg-white/50 p-2 rounded hover:bg-white transition-colors">
                  <span className="text-emerald-400 mt-1.5 text-[10px] flex-shrink-0 opacity-80 print:text-black">●</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};