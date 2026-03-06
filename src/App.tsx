/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Wand2, 
  Copy, 
  Check, 
  Sparkles, 
  Terminal, 
  History as HistoryIcon, 
  Trash2,
  ArrowRight,
  Loader2,
  Info,
  Sun,
  Moon,
  X,
  Settings2,
  ChevronDown,
  MessageSquare,
  Target,
  Layout,
  Zap,
  ShieldAlert,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini API safely
const getApiKey = () => {
  // Try Vite environment variable first (standard for Vercel/Vite)
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {
    console.warn("Vite env access failed", e);
  }
  
  // Fallback to process.env (handled by vite.config.ts define or Node)
  try {
    // @ts-ignore - process might not be defined
    if (typeof process !== 'undefined' && process.env) {
      return process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    }
  } catch (e) {
    console.warn("Process env access failed", e);
  }
  return '';
};

interface PromptResult {
  title: string;
  improvedPrompt: string;
  explanation: string;
  timestamp: number;
}

type AppMode = 'lite' | 'pro' | 'advanced';

const TONE_OPTIONS = ['Professional', 'Creative', 'Witty', 'Academic', 'Friendly', 'Urgent', 'Empathetic', 'Authoritative'];
const AUDIENCE_OPTIONS = ['General', 'Expert', 'Beginner', 'Executive', 'Technical', 'Children', 'Skeptical'];
const FORMAT_OPTIONS = ['Markdown', 'HTML', 'Bullet Points', 'Step-by-Step', 'JSON', 'Table', 'Essay', 'Email'];

export default function App() {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [result, setResult] = useState<PromptResult | null>(null);
  const [history, setHistory] = useState<PromptResult[]>([]);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('prompt_architect_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>('pro');
  const [hasGenerated, setHasGenerated] = useState(false);
  
  const aiRef = useRef<GoogleGenAI | null>(null);

  const getAI = () => {
    if (!aiRef.current) {
      const key = getApiKey();
      if (key) {
        aiRef.current = new GoogleGenAI({ apiKey: key });
      }
    }
    return aiRef.current;
  };

  // Advanced Options
  const [tone, setTone] = useState('');
  const [audience, setAudience] = useState('');
  const [format, setFormat] = useState('');
  const [negativeConstraints, setNegativeConstraints] = useState('');
  const [examples, setExamples] = useState('');

  const resultRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('prompt_architect_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('prompt_architect_history', JSON.stringify(history));
  }, [history]);

  // Save theme to localStorage and update document class
  useEffect(() => {
    localStorage.setItem('prompt_architect_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const generatePrompt = async () => {
    if (!input.trim()) return;

    const ai = getAI();
    if (!ai) {
      setApiKeyMissing(true);
      setTimeout(() => setApiKeyMissing(false), 5000);
      return;
    }

    setIsGenerating(true);
    setResult(null);
    setHasGenerated(true);

    try {
      let advancedContext = '';
      if (appMode !== 'lite') {
        advancedContext = `
          ${tone ? `- Tone: ${tone}` : ''}
          ${audience ? `- Audience: ${audience}` : ''}
          ${format ? `- Format: ${format}` : ''}
        `.trim();
      }

      if (appMode === 'advanced') {
        advancedContext += `
          ${negativeConstraints ? `\n- Negative Constraints (Avoid these): ${negativeConstraints}` : ''}
          ${examples ? `\n- Reference Examples:\n${examples}` : ''}
        `.trim();
      }

    const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Convert this raw sentence into a highly structured, detailed, and optimized AI prompt: "${input}"
        ${advancedContext ? `\nAdditional Context & Requirements:\n${advancedContext}` : ''}`,
        config: {
          systemInstruction: `You are an Expert Prompt Engineer AI. Your task is to convert any simple or unclear user sentence into a highly structured, detailed, and optimized AI prompt that produces the best possible output.

When given a raw sentence, you must:
1. Understand the true intent behind the sentence.
2. Identify missing details (format, audience, style, tone, constraints, tools, etc.).
3. Expand the sentence into a clear, professional, well-structured prompt.

Your output MUST follow this exact JSON structure:
{
  "title": "A descriptive title for the prompt",
  "improvedPrompt": "The full structured prompt including sections like Role, Goal, Output Format, Features, Design Requirements, Technical Constraints, etc.",
  "explanation": "A brief explanation of what you improved and why."
}

Ensure the improvedPrompt is formatted with clear headings and bullet points for readability.`,
          responseMimeType: "application/json"
        },
      });

      const data = JSON.parse(response.text || '{}');
      const newResult: PromptResult = {
        ...data,
        timestamp: Date.now()
      };

      setResult(newResult);
      setHistory(prev => [newResult, ...prev].slice(0, 20)); // Keep last 20
      
      // Scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error) {
      console.error("Generation failed:", error);
      setResult({
        title: "Error",
        improvedPrompt: "Failed to generate prompt. Please check your connection and try again.",
        explanation: "The AI service encountered an error.",
        timestamp: Date.now()
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('prompt_architect_history');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-gradient-to-br from-[#F8F9FA] via-[#F0F2F5] to-[#E9ECEF] dark:from-[#0A0B0E] dark:via-[#111418] dark:to-[#0A0B0E] animate-gradient text-[#1A1A1A] dark:text-[#E2E8F0] font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/30 transition-colors duration-300`}>
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#111418]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-display font-bold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">Prompt Studio</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
              {(['lite', 'pro', 'advanced'] as AppMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAppMode(mode)}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    appMode === mode 
                      ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-2" />

            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
              title="History"
            >
              <HistoryIcon className="w-5 h-5" />
            </button>

            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* History Sidebar */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-white dark:bg-[#111418] border-l border-gray-200 dark:border-gray-800 z-50 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 font-display font-bold text-gray-900 dark:text-white">
                  <HistoryIcon className="w-5 h-5 text-brand-600" />
                  <span>Recent Builds</span>
                </div>
                <button 
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto h-[calc(100vh-180px)] pr-2 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <HistoryIcon className="w-12 h-12 text-gray-200 dark:text-gray-800 mx-auto" />
                    <p className="text-sm text-gray-400 italic">No history yet.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.timestamp}
                      onClick={() => {
                        setResult(item);
                        setIsHistoryOpen(false);
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-all group ${
                        result?.timestamp === item.timestamp
                          ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800'
                          : 'bg-gray-50 dark:bg-gray-800/50 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-white truncate pr-4">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {item.explanation}
                      </p>
                    </button>
                  ))
                )}
              </div>

              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="absolute bottom-6 left-6 right-6 flex items-center justify-center gap-2 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear History</span>
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center space-y-8">
          
          {/* Intro - Centered */}
          <section className="space-y-6 text-center mb-4">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full text-[11px] font-bold uppercase tracking-widest border border-brand-100 dark:border-brand-800"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Next-Gen Prompt Engineering</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-3xl md:text-5xl font-display font-black tracking-tighter text-gray-900 dark:text-white leading-[1.1]"
            >
              Stop Guessing. <br className="hidden md:block" />
              <span className="text-brand-600 bg-gradient-to-r from-brand-600 via-indigo-500 to-brand-600 bg-[length:200%_auto] animate-[gradient_3s_linear_infinite] bg-clip-text text-transparent">Architect.</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-light"
            >
              Vague prompts lead to vague results. Our AI-powered architect bridges the gap between your vision and the model's logic, crafting structured prompts that unlock peak performance.
            </motion.p>
          </section>

          {/* Main Input Area - Centered & Professional Size */}
          <section className="w-full space-y-6 relative">
            <AnimatePresence>
              {apiKeyMissing && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute -top-12 left-0 right-0 bg-red-500 text-white text-[10px] font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 z-50 shadow-lg"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>API KEY MISSING: Add VITE_GEMINI_API_KEY to Vercel Environment Variables.</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white dark:bg-[#111418] border border-gray-200 dark:border-gray-800 rounded-[1.5rem] shadow-xl shadow-gray-200/40 dark:shadow-none overflow-hidden">
              <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    <Sparkles className="w-4 h-4 text-brand-500" />
                    <span>Input Raw Intent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mode:</span>
                    <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">{appMode}</span>
                  </div>
                </div>

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe what you want the AI to do in plain English..."
                  className="w-full min-h-[120px] bg-transparent border-none focus:ring-0 text-base font-display font-medium placeholder:text-gray-200 dark:placeholder:text-gray-800 resize-none outline-none dark:text-white"
                />

                {/* Dynamic Features based on Mode */}
                {appMode !== 'lite' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        <MessageSquare className="w-3 h-3" />
                        Tone
                      </label>
                      <select 
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                      >
                        <option value="" className="dark:bg-gray-800">Default Tone</option>
                        {TONE_OPTIONS.map(opt => <option key={opt} value={opt} className="dark:bg-gray-800">{opt}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        <Target className="w-3 h-3" />
                        Audience
                      </label>
                      <select 
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                      >
                        <option value="" className="dark:bg-gray-800">Default Audience</option>
                        {AUDIENCE_OPTIONS.map(opt => <option key={opt} value={opt} className="dark:bg-gray-800">{opt}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        <Layout className="w-3 h-3" />
                        Format
                      </label>
                      <select 
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                      >
                        <option value="" className="dark:bg-gray-800">Default Format</option>
                        {FORMAT_OPTIONS.map(opt => <option key={opt} value={opt} className="dark:bg-gray-800">{opt}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {appMode === 'advanced' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-800"
                  >
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        <ShieldAlert className="w-3 h-3" />
                        Negative Constraints
                      </label>
                      <input 
                        type="text"
                        value={negativeConstraints}
                        onChange={(e) => setNegativeConstraints(e.target.value)}
                        placeholder="What should the AI avoid?"
                        className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        <Lightbulb className="w-3 h-3" />
                        Few-Shot Examples
                      </label>
                      <input 
                        type="text"
                        value={examples}
                        onChange={(e) => setExamples(e.target.value)}
                        placeholder="Provide a reference example..."
                        className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-white"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/30 px-6 py-3 flex items-center justify-end">
                <button
                  onClick={generatePrompt}
                  disabled={isGenerating || !input.trim()}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all text-sm ${
                    isGenerating || !input.trim()
                      ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                      : 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-500/20 active:scale-95'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Architecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Optimize Prompt</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Results Area - Centered */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                ref={resultRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-bold tracking-tight text-gray-900 dark:text-white">
                    {result.title}
                  </h2>
                  <button
                    onClick={() => copyToClipboard(result.improvedPrompt)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy Prompt'}</span>
                  </button>
                </div>

                <div className="bg-[#0D1117] rounded-[1.25rem] overflow-hidden shadow-xl border border-gray-800">
                  <div className="bg-[#161B22] px-5 py-2 flex items-center justify-between border-b border-gray-800">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3 h-3 text-gray-500" />
                      <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-bold">OPTIMIZED_PROMPT.md</span>
                    </div>
                  </div>
                  <div className="p-6 overflow-x-auto">
                    <pre className="text-brand-300 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                      {result.improvedPrompt}
                    </pre>
                  </div>
                </div>

                <div className="bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800 rounded-[1.25rem] p-6 flex gap-4">
                  <div className="shrink-0">
                    <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/30 rounded-lg flex items-center justify-center text-brand-600 dark:text-brand-400">
                      <Info className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-brand-900 dark:text-brand-300 text-base">Architect's Notes</h3>
                    <p className="text-brand-700/80 dark:text-brand-400/80 leading-relaxed text-sm font-light">
                      {result.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips - Centered if not generated */}
          {!hasGenerated && (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <section className="bg-brand-600 rounded-[1.25rem] p-6 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <h3 className="font-display font-bold text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Pro Tips
                  </h3>
                  <ul className="space-y-2 text-xs text-brand-100 font-light">
                    <li className="flex gap-2">
                      <div className="w-1 h-1 bg-brand-300 rounded-full mt-1.5 shrink-0" />
                      <span>Define your **audience** to set complexity.</span>
                    </li>
                    <li className="flex gap-2">
                      <div className="w-1 h-1 bg-brand-300 rounded-full mt-1.5 shrink-0" />
                      <span>Use **Negative Constraints** to avoid pitfalls.</span>
                    </li>
                  </ul>
                </div>
              </section>

              <div className="p-6 bg-white dark:bg-[#111418] border border-gray-200 dark:border-gray-800 rounded-[1.25rem] shadow-sm space-y-2">
                <h4 className="font-display font-bold text-base text-gray-900 dark:text-white">Why Architect?</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-light">
                  Vague prompts lead to vague results. We bridge the gap between your intent and the AI's understanding.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-8 bg-white dark:bg-[#0A0B0E]">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 opacity-60">
            <div className="w-6 h-6 bg-brand-600 rounded-lg flex items-center justify-center">
              <Wand2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-gray-900 dark:text-white text-base">Prompt Studio</span>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Created by <span className="text-brand-600 dark:text-brand-400 font-bold">Sam Sarvesh</span>
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-light">
              Powered by Gemini, Made in India with ❤
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
