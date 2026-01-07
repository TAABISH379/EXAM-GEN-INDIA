import { Board, ClassLevel, Subject } from './types';

export const BOARDS: Board[] = ['CBSE', 'ICSE'];
export const CLASSES: ClassLevel[] = ['10', '12'];

export const CLASS_10_SUBJECTS: Subject[] = [
  'Mathematics',
  'Science',
  'Social Science',
  'English',
  'Hindi',
  'Computer Science'
];

export const CLASS_12_SUBJECTS: Subject[] = [
  'Physics',
  'Chemistry',
  'Mathematics',
  'Biology',
  'English',
  'Hindi',
  'Computer Science',
  'Accountancy',
  'Business Studies',
  'Economics',
  'History',
  'Geography',
  'Political Science',
  'Psychology'
];

// Comprehensive list covering Science, Commerce, and Humanities
export const SUBJECTS: Subject[] = [
  ...new Set([...CLASS_10_SUBJECTS, ...CLASS_12_SUBJECTS])
];

export const INITIAL_INSTRUCTIONS = [
  "This question paper contains multiple sections.",
  "All questions are compulsory unless permitted otherwise.",
  "Write your answers neatly and clearly.",
  "Figures to the right indicate full marks.",
  "Use of calculators is not permitted."
];