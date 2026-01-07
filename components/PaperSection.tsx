import React from 'react';
import { ExamSection } from '../types';
import { QuestionItem } from './QuestionItem';

interface PaperSectionProps {
  section: ExamSection;
  showMarkingScheme: boolean;
  isPracticeMode?: boolean;
  onGenerateImage?: (questionId: string, description: string) => Promise<string | undefined>;
}

export const PaperSection: React.FC<PaperSectionProps> = ({ section, showMarkingScheme, isPracticeMode, onGenerateImage }) => {
  return (
    <div className="mb-8">
      <div className="text-center mb-6 font-serif">
        <h2 className="text-lg font-bold uppercase tracking-wide">{section.name}</h2>
        {section.description && <p className="italic text-gray-600 print:text-black">{section.description}</p>}
      </div>
      
      <div className="space-y-4">
        {section.questions.map((q, idx) => (
          <QuestionItem 
            key={q.id} 
            question={q} 
            index={idx} 
            showMarkingScheme={showMarkingScheme} 
            isPracticeMode={isPracticeMode}
            onGenerateImage={onGenerateImage}
          />
        ))}
      </div>
    </div>
  );
};