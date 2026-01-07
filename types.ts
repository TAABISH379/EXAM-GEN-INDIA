
export type Board = 'CBSE' | 'ICSE';
export type ClassLevel = '10' | '12';

export type Subject = 
  | 'Mathematics' 
  | 'Science' 
  | 'Social Science' 
  | 'Physics' 
  | 'Chemistry' 
  | 'Biology' 
  | 'History' 
  | 'Geography' 
  | 'English' 
  | 'Hindi'
  | 'Computer Science'
  | 'Accountancy'
  | 'Business Studies'
  | 'Economics'
  | 'Psychology'
  | 'Political Science';

export interface User {
  name: string;
  email: string;
  board: Board;
  classLevel: ClassLevel;
}

export interface ExamParams {
  board: Board;
  classLevel: ClassLevel;
  subject: Subject;
  difficulty: 'Standard' | 'Easy' | 'Medium' | 'Hard';
  mode: 'exam' | 'practice';
}

export interface Question {
  id: string;
  questionText: string;
  marks: number;
  type: 'MCQ' | 'Very Short' | 'Short' | 'Long' | 'Case Study';
  options?: string[]; // For MCQs
  correctAnswer?: string; // For MCQs/One word
  markingScheme: string[]; // Step-wise breakdown
  imageDescription?: string; // Description of the diagram if needed (e.g. "Circuit diagram with 3 resistors")
  imageUrl?: string; // Base64 string of the generated image
}

export interface ExamSection {
  name: string; // e.g., "Section A"
  description?: string; // e.g., "Reading Skills"
  questions: Question[];
}

export interface ExamPaper {
  title: string;
  board: string;
  classLevel: string;
  subject: string;
  timeAllowed: string; // e.g., "3 Hours"
  maximumMarks: number;
  generalInstructions: string[];
  sections: ExamSection[];
}

export interface SavedPaper {
  id: string;
  timestamp: number;
  paper: ExamPaper;
}

export interface QuestionEvaluation {
  questionId: string;
  marksObtained: number;
  feedback: string;
}

export interface EvaluationResult {
  questionEvaluations: QuestionEvaluation[];
  totalScore: number;
  maxScore: number;
  generalFeedback: string;
}

export interface PastExam {
  id: string;
  timestamp: number;
  subject: string;
  score: number;
  totalMarks: number;
  paperTitle: string;
  evaluation: EvaluationResult;
}
