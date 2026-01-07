import { GoogleGenAI, Schema, Type } from "@google/genai";
import { ExamPaper, ExamParams, EvaluationResult } from "../types";

// Define the response schema for strict JSON output
const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    questionText: { type: Type.STRING },
    marks: { type: Type.NUMBER },
    type: { type: Type.STRING, enum: ['MCQ', 'Very Short', 'Short', 'Long', 'Case Study'] },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correctAnswer: { type: Type.STRING },
    markingScheme: { type: Type.ARRAY, items: { type: Type.STRING } },
    imageDescription: { type: Type.STRING, description: "Visual description if diagram required. Omit if not." },
  },
  required: ['id', 'questionText', 'marks', 'type', 'markingScheme'],
};

const sectionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    questions: { type: Type.ARRAY, items: questionSchema },
  },
  required: ['name', 'questions'],
};

const paperSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    board: { type: Type.STRING },
    classLevel: { type: Type.STRING },
    subject: { type: Type.STRING },
    timeAllowed: { type: Type.STRING },
    maximumMarks: { type: Type.NUMBER },
    generalInstructions: { type: Type.ARRAY, items: { type: Type.STRING } },
    sections: { type: Type.ARRAY, items: sectionSchema },
  },
  required: ['title', 'board', 'classLevel', 'subject', 'maximumMarks', 'sections'],
};

// Schema for Evaluation
const evaluationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questionEvaluations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionId: { type: Type.STRING },
          marksObtained: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
        },
        required: ['questionId', 'marksObtained', 'feedback']
      }
    },
    totalScore: { type: Type.NUMBER },
    maxScore: { type: Type.NUMBER },
    generalFeedback: { type: Type.STRING }
  },
  required: ['questionEvaluations', 'totalScore', 'maxScore', 'generalFeedback']
};

export const generateExamPaper = async (params: ExamParams): Promise<ExamPaper> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Strictly constructed system instruction based on "Expert Paper Setter" persona
  const systemInstruction = `
    You are an expert Indian school examination paper setter.
    Your task is to generate exam-ready sample question papers.

    MANDATE:
    1. Follow the latest official ${params.board} syllabus for Class ${params.classLevel}.
    2. Follow the EXACT board-wise exam pattern and marks distribution.
    3. Do NOT copy past-year questions verbatim.
    4. Use board-appropriate language.

    DIAGRAMS:
    - Identify questions that require a visual aid.
    - Provide a concise 'imageDescription' (e.g., "Right triangle ABC, B=90, AB=3, BC=4").
    - The 'questionText' should reference the diagram.

    BOARD RULES (${params.board}):
    ${params.board === 'CBSE' ? `
    - Competency-based. Real-life applications.
    - Class 10 Math: 5 Sections (A:20 MCQs, B:5 Short, C:6 Short, D:4 Long, E:3 Case-based).
    - Class 10 Science: 5 Sections (A:MCQs, B:2M, C:3M, D:5M, E:Case-based).
    ` : `
    - Descriptive, structured.
    - Section A (Compulsory), Section B (Choice).
    - For Section B, generate ALL optional questions so the student can choose.
    `}

    MARKING SCHEME:
    - Provide a step-wise marking scheme.
    - KEY: Keep allocations PRECISE but CONCISE (e.g. "Formula(½), Subst(½), Ans(1)") to save space.

    OUTPUT:
    - JSON only.
    - Total marks must equal standard maximum (e.g. 80).
  `;

  const difficultyMap: Record<string, string> = {
    'Easy': '60% Easy, 30% Medium, 10% Hard',
    'Medium': '30% Easy, 50% Medium, 20% Hard',
    'Hard': '20% Easy, 30% Medium, 50% Hard',
    'Standard': '40% Easy, 40% Medium, 20% Hard',
  };

  const distribution = difficultyMap[params.difficulty] || difficultyMap['Standard'];

  const prompt = `
    Generate a full ${params.difficulty} Level Sample Question Paper for:
    Board: ${params.board}, Class: ${params.classLevel}, Subject: ${params.subject}
    
    Details:
    - Difficulty: ${distribution}.
    - Follow official Blueprint.
    - IMPORTANT: If a question needs a diagram, provide 'imageDescription'.
    - CRITICAL: Keep 'markingScheme' strings short and concise to prevent response truncation.
    
    Generate sections, questions, and marking schemes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", 
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: paperSchema,
        temperature: 0.2, 
      },
    });

    let text = response.text;
    if (!text) {
      // Check if candidates exist but text is empty (e.g. blocked)
      const candidate = response.candidates?.[0];
      if (candidate && candidate.finishReason !== 'STOP') {
         throw new Error(`Generation stopped: ${candidate.finishReason}`);
      }
      throw new Error("No response generated");
    }

    // Robust JSON extraction
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
       text = text.substring(firstBrace, lastBrace + 1);
    } else {
       // Fallback sanitization
       text = text.trim();
       if (text.startsWith("```")) {
          text = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
       }
    }

    return JSON.parse(text) as ExamPaper;
  } catch (error) {
    console.error("Error generating paper:", error);
    throw error;
  }
};

export const generateDiagramImage = async (description: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Create a clean, clear, black and white line-art educational diagram for a school examination paper. 
  The diagram should be suitable for printing on white paper. No colors, no complex shading. High contrast.
  Subject: ${description}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "4:3",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
       if (part.inlineData) {
         return `data:image/png;base64,${part.inlineData.data}`;
       }
    }
    throw new Error("No image data received");
  } catch (error) {
    console.error("Error generating diagram:", error);
    throw error;
  }
};

export const evaluateAnswerSheet = async (
  paper: ExamPaper, 
  images: string[] // Array of base64 strings
): Promise<EvaluationResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });

  // Simplify paper context to reduce token usage
  const simplifiedPaper = paper.sections.map(s => ({
    section: s.name,
    questions: s.questions.map(q => ({
      id: q.id,
      text: q.questionText,
      marks: q.marks,
      scheme: q.markingScheme
    }))
  }));

  const systemInstruction = `
    You are an expert strict examiner for the ${paper.board} board.
    Your task is to grade the student's handwritten answer sheet images against the provided question paper and marking scheme.
    
    RULES:
    1. Match the answers in the images to the Question IDs.
    2. Award marks STRICTLY based on the marking scheme provided.
    3. Be precise. If a step is missing, deduct marks.
    4. Provide constructive, brief feedback for every question attempted.
    5. If a question is not found in the images, mark it as 0 with feedback "Not attempted".
    6. Return a structured JSON response.
  `;

  // Prepare contents: Text Context + Images
  const parts: any[] = [
    { text: `Here is the Question Paper Context (JSON): ${JSON.stringify(simplifiedPaper)}` },
    { text: "Evaluate the following answer sheet images:" }
  ];

  // Append images
  images.forEach(base64 => {
    // Strip prefix if present (e.g. "data:image/jpeg;base64,")
    const cleanBase64 = base64.split(',')[1] || base64;
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg', // Assuming jpeg/png converted
        data: cleanBase64
      }
    });
  });

  try {
    // Using gemini-2.0-flash-exp (or gemini-3-flash-preview) as it has vision capabilities and large context
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: evaluationSchema
      }
    });

    if (!response.text) throw new Error("Grading failed to generate text");
    
    return JSON.parse(response.text) as EvaluationResult;
  } catch (error) {
    console.error("Evaluation error:", error);
    throw error;
  }
};