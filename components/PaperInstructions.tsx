import React from 'react';

interface PaperInstructionsProps {
  instructions: string[];
}

export const PaperInstructions: React.FC<PaperInstructionsProps> = ({ instructions }) => {
  if (!instructions || instructions.length === 0) return null;

  return (
    <div className="mb-8 font-serif text-sm">
      <h3 className="font-bold mb-2 uppercase text-sm">General Instructions:</h3>
      <ol className="list-decimal pl-5 space-y-1">
        {instructions.map((inst, idx) => (
          <li key={idx} className="leading-tight">{inst}</li>
        ))}
      </ol>
    </div>
  );
};
