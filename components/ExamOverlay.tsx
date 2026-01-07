import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Clock, UploadCloud, FileText, CheckCircle, X, Loader2, BookOpen, SkipForward, AlertCircle, ArrowLeft, Send, Eye, Video, Mic, GraduationCap } from 'lucide-react';

interface ExamOverlayProps {
  duration: string; // e.g. "3 Hours"
  subject: string;
  difficulty: string;
  onClose: () => void;
  onSubmit: (files: File[]) => void;
  isSubmitting: boolean;
}

export const ExamOverlay: React.FC<ExamOverlayProps> = ({ duration, subject, difficulty, onClose, onSubmit, isSubmitting }) => {
  const [phase, setPhase] = useState<'reading' | 'writing'>('reading');
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 minutes default for reading
  const [examDuration, setExamDuration] = useState<number>(0);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isProctoringActive, setIsProctoringActive] = useState(false);

  // Proctoring Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null); // Keep track of the session
  const nextStartTimeRef = useRef<number>(0);

  // Parse duration string to seconds
  useEffect(() => {
    const hoursMatch = duration.match(/(\d+)\s*Hour/i);
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 3;
    setExamDuration(hours * 3600);
  }, [duration]);

  // Main Timer Logic
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Handle Phase Transition automatically
  useEffect(() => {
    if (timeLeft === 0 && phase === 'reading' && examDuration > 0) {
      handleStartWriting();
    }
  }, [timeLeft, phase, examDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProctoring();
    };
  }, []);

  const stopProctoring = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    // Check if context is closed before calling close to avoid error
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(e => console.warn("Error closing audio context", e));
    }
    // Explicitly close the Live API session to prevent Network Errors
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.warn("Error closing session", e);
      }
      sessionRef.current = null;
    }
    setIsProctoringActive(false);
  };

  const handleStartWriting = async () => {
    setPhase('writing');
    setTimeLeft(examDuration);
    setNotification("Exam Started! Proctoring is active. Do not look away.");
    setTimeout(() => setNotification(null), 5000);
    
    // Start Proctoring
    try {
      await startProctoring();
    } catch (err) {
      console.error("Failed to start proctoring", err);
      setNotification("Warning: Camera/Mic access required for exam.");
    }
  };

  // --- Gemini Live API Implementation ---

  const startProctoring = async () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setIsProctoringActive(true);

      const ai = new GoogleGenAI({ apiKey });
      
      // Audio Contexts
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputAudioContext;
      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);

      // Helper to process audio chunks from model
      const playAudioChunk = async (base64Audio: string) => {
        if (outputAudioContext.state === 'closed') return; // Double check

        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = outputAudioContext.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) {
            channelData[i] = dataInt16[i] / 32768.0;
        }

        const source = outputAudioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(outputNode);
        
        const currentTime = outputAudioContext.currentTime;
        // Schedule next chunk
        const startTime = Math.max(currentTime, nextStartTimeRef.current);
        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are a strict exam proctor. You are watching a student take an exam via video feed. If the student looks away from the screen, talks to someone else, uses a phone, or leaves the frame, sternly warn them. Say things like 'Warning: Eyes on screen', 'Warning: No talking', 'Warning: Face not visible'. If they are behaving normally, stay silent. Be concise.",
          speechConfig: {
             voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        },
        callbacks: {
          onopen: () => {
            console.log("Proctoring Session Connected");
            
            // 1. Audio Input Stream
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
               // Prevent sending if session is closed/null
               if (!isProctoringActive && !sessionRef.current) return;

               const inputData = e.inputBuffer.getChannelData(0);
               const l = inputData.length;
               const int16 = new Int16Array(l);
               for (let i = 0; i < l; i++) {
                 int16[i] = inputData[i] * 32768;
               }
               let binary = '';
               const bytes = new Uint8Array(int16.buffer);
               for (let i = 0; i < bytes.byteLength; i++) {
                  binary += String.fromCharCode(bytes[i]);
               }
               const base64Data = btoa(binary);

               sessionPromise.then(session => {
                  session.sendRealtimeInput({
                     media: {
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64Data
                     }
                  });
               }).catch(() => {}); // Catch connection errors
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);

            // 2. Video Input Stream (1 FPS is enough for proctoring)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const videoEl = videoRef.current;
            
            if (videoEl && ctx) {
               const intervalId = setInterval(async () => {
                  // Check if proctoring is still active
                  if (!sessionRef.current) {
                      clearInterval(intervalId);
                      return;
                  }

                  if (videoEl.readyState === 4) {
                     canvas.width = videoEl.videoWidth / 4; 
                     canvas.height = videoEl.videoHeight / 4;
                     ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                     const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                     
                     sessionPromise.then(session => {
                        session.sendRealtimeInput({
                           media: {
                              mimeType: 'image/jpeg',
                              data: base64
                           }
                        });
                     }).catch(() => {}); // Catch connection errors
                  }
               }, 1000); 
            }
          },
          onmessage: (msg: LiveServerMessage) => {
             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData) {
                playAudioChunk(audioData);
                setNotification("⚠️ PROCTOR WARNING: Suspicious Activity");
                setTimeout(() => setNotification(null), 3000);
             }
          },
          onclose: () => {
              console.log("Proctoring Session Closed");
              sessionRef.current = null;
          },
          onerror: (e) => {
              console.error("Proctoring Error", e);
              // Don't alert user intrusively for network blips, just log
          }
        }
      });

      // Capture session reference
      sessionPromise.then(sess => {
          sessionRef.current = sess;
      }).catch(e => {
          console.error("Connection failed initially", e);
          setNotification("Proctoring connection issue. Exam continues.");
      });

    } catch (e) {
       console.error("Error initializing proctoring:", e);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isReading = phase === 'reading';

  return (
    <>
      {/* Floating Timer Bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] flex justify-center p-2 md:p-4 pointer-events-none">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-2 pl-3 md:pl-4 md:pr-2 rounded-2xl shadow-2xl border border-slate-700 pointer-events-auto flex items-center gap-2 md:gap-4 animate-fade-in-down max-w-full overflow-x-auto relative overflow-visible custom-scrollbar">
          
          {/* Subject Info */}
          <div className="hidden lg:flex items-center gap-3 border-r border-slate-700 pr-4">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
               <GraduationCap className="w-5 h-5" />
            </div>
            <div>
               <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">
                  Subject
               </p>
               <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-slate-200 leading-none whitespace-nowrap">{subject}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    difficulty === 'Hard' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    difficulty === 'Medium' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                    'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    {difficulty}
                  </span>
               </div>
            </div>
          </div>

          {/* Phase Indicator & Timer */}
          <div className="flex items-center gap-2 md:gap-3 border-r border-slate-700 pr-2 md:pr-4">
             <div className={`p-1.5 md:p-2 rounded-lg ${isReading ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                {isReading ? <BookOpen className="w-4 h-4 md:w-5 md:h-5" /> : <Clock className="w-4 h-4 md:w-5 md:h-5" animate-pulse />}
             </div>
             <div>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-0.5 md:mb-1">
                   {isReading ? 'Reading' : 'Remaining'}
                </p>
                <p className={`font-mono text-base md:text-xl font-bold leading-none ${isReading ? 'text-blue-400' : 'text-red-400'}`}>
                   {formatTime(timeLeft)}
                </p>
             </div>
          </div>

          {/* Proctoring Preview (Only in Writing Phase) */}
          {!isReading && (
             <div className="flex items-center gap-2 md:gap-3 border-r border-slate-700 pr-2 md:pr-4">
                <div className="relative w-12 md:w-16 h-8 md:h-10 bg-black rounded-md overflow-hidden border border-slate-600 shadow-inner">
                   <video ref={videoRef} className="w-full h-full object-cover opacity-80" muted playsInline />
                   {isProctoringActive && (
                      <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full animate-pulse border border-black"></div>
                   )}
                </div>
                <div className="hidden md:block">
                   <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 leading-none mb-1">
                      AI Proctor
                   </p>
                   <p className="text-xs font-bold text-emerald-400 leading-none flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Active
                   </p>
                </div>
             </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
             {isReading ? (
                <button 
                  onClick={handleStartWriting}
                  className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-xl transition-colors whitespace-nowrap"
                >
                  <SkipForward className="w-3 h-3 md:w-4 md:h-4" /> Skip
                </button>
             ) : (
                <button 
                  onClick={() => setIsSubmissionOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-900/20 animate-pulse-slow whitespace-nowrap"
                >
                  <Send className="w-3 h-3 md:w-4 md:h-4" /> Submit
                </button>
             )}
             
             {/* Only allow close during reading time */}
             {isReading && (
                <button 
                   onClick={onClose} 
                   className="p-1.5 md:p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                   title="Minimize / Close Timer"
                >
                   <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
             )}
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-24 md:top-28 left-1/2 -translate-x-1/2 z-[70] animate-bounce-in w-max max-w-[90vw]">
           <div className="bg-slate-800 text-white px-4 py-2 md:px-6 md:py-3 rounded-full shadow-2xl flex items-center gap-2 md:gap-3 font-bold border border-emerald-500/30 ring-1 ring-emerald-500/20 backdrop-blur-xl">
              {notification.includes("Warning") ? <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-400" /> : <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />}
              <span className="text-xs md:text-sm tracking-wide">{notification}</span>
           </div>
        </div>
      )}

      {/* Full Screen Submission Modal */}
      {isSubmissionOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 md:p-6 animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-800 rounded-2xl border border-slate-700 p-6 md:p-8 shadow-2xl relative my-auto">
             
             <button 
                onClick={() => setIsSubmissionOpen(false)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider"
             >
                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" /> Back to Exam
             </button>

             <div className="text-center mb-6 md:mb-8 mt-6">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Upload Answer Sheets</h3>
                <p className="text-sm md:text-base text-slate-400">
                   Scan or take photos of your handwritten pages.
                </p>
             </div>

             <div className="border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-xl p-6 md:p-8 mb-6 text-center transition-all relative cursor-pointer group">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-3 pointer-events-none">
                   <div className="p-3 md:p-4 bg-indigo-500/20 rounded-full group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6 md:w-8 md:h-8 text-indigo-400" />
                   </div>
                   <div>
                      <p className="text-sm md:text-base text-indigo-300 font-semibold">Click or Drag images here</p>
                      <p className="text-[10px] md:text-xs text-slate-500 mt-1">Supports JPG, PNG (Max 5MB each)</p>
                   </div>
                </div>
             </div>

             {/* File List */}
             {files.length > 0 && (
                <div className="space-y-2 mb-6 md:mb-8 max-h-40 overflow-y-auto custom-scrollbar bg-slate-900/50 p-2 rounded-xl border border-slate-700">
                   {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-800 p-2 md:p-3 rounded-lg border border-slate-700">
                         <div className="flex items-center gap-3 overflow-hidden">
                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-xs md:text-sm text-slate-200 truncate">{file.name}</span>
                            <span className="text-xs text-slate-500 uppercase shrink-0">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                         </div>
                         <button onClick={() => removeFile(idx)} className="text-slate-500 hover:text-red-400 shrink-0 ml-2">
                            <X className="w-4 h-4" />
                         </button>
                      </div>
                   ))}
                </div>
             )}

             <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <button 
                  onClick={() => setIsSubmissionOpen(false)}
                  className="flex-1 py-3 md:py-4 rounded-xl font-bold text-xs md:text-sm uppercase tracking-widest text-slate-400 hover:bg-slate-700 transition-colors order-2 sm:order-1"
                >
                   Cancel
                </button>
                <button 
                  onClick={() => {
                     stopProctoring(); 
                     onSubmit(files);
                  }}
                  disabled={files.length === 0 || isSubmitting}
                  className={`flex-[2] py-3 md:py-4 rounded-xl font-bold text-xs md:text-sm uppercase tracking-widest transition-all order-1 sm:order-2 ${
                     files.length === 0 
                     ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                     : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                  }`}
                >
                  {isSubmitting ? (
                     <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> Analyzing...
                     </span>
                  ) : (
                     <span className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4 md:w-5 md:h-5" /> Submit for Evaluation
                     </span>
                  )}
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};